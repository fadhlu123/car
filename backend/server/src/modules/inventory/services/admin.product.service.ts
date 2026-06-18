import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getProductModel } from '../models/product.model';
import { uploadImageBuffer, deleteImageFromCloud } from '../../../utils/upload.utils';
import { toSummary, toDetail } from './product.mappers';
import {
  CreateProductInput,
  UpdateProductInput,
  AdminListProductsQuery,
  ListResult,
  ProductDetail,
} from '../types/inventory.types';

const logger = createLogger('admin-product-service');

const ERRORS = {
  NOT_FOUND:     'Product not found',
  INVALID_ID:    'Invalid product ID',
  IMAGE_NOT_FOUND: 'Image not found on this product',
  MAX_IMAGES:    'A product can have at most 10 images',
} as const;

const MAX_IMAGES = 10;
const IMAGE_FOLDER = 'auto-majid/inventory';

const assertValidId = (id: string, msg: string = ERRORS.INVALID_ID) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(msg, 400);
};

export const listAllProducts = async (query: AdminListProductsQuery): Promise<ListResult> => {
  const Product = await getProductModel();
  const page    = Math.max(1, query.page  ?? 1);
  const limit   = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip    = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.is_published !== undefined) filter.is_published = query.is_published;
  if (query.condition)    filter.condition    = query.condition;
  if (query.availability) filter.availability = query.availability;
  if (query.category)     filter.category     = new RegExp(query.category, 'i');
  if (query.make)         filter.make         = new RegExp(query.make, 'i');
  if (query.min_price !== undefined || query.max_price !== undefined) {
    const p: Record<string, number> = {};
    if (query.min_price !== undefined) p.$gte = query.min_price;
    if (query.max_price !== undefined) p.$lte = query.max_price;
    filter.price = p;
  }
  if (query.search) filter.$text = { $search: query.search };

  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products:    docs.map(toSummary as any),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

export const getProductAdmin = async (id: string): Promise<ProductDetail> => {
  assertValidId(id);
  const Product = await getProductModel();
  const doc = await Product.findById(id);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);
  return toDetail(doc);
};

export const createProduct = async (
  data: CreateProductInput,
  adminId: string,
  files: Express.Multer.File[]
): Promise<ProductDetail> => {
  const Product = await getProductModel();

  // Upload all images in parallel
  const imageResults = await Promise.all(
    files.map((f) => uploadImageBuffer(f.buffer, IMAGE_FOLDER))
  );

  const doc = await Product.create({
    ...data,
    is_published: true,
    images:     imageResults.map((r) => ({ url: r.url, public_id: r.public_id })),
    created_by: new mongoose.Types.ObjectId(adminId),
  });

  logger.info('Product created', { productId: doc._id.toString(), adminId });
  return toDetail(doc);
};

export const updateProduct = async (
  id: string,
  data: UpdateProductInput
): Promise<ProductDetail> => {
  assertValidId(id);
  const Product = await getProductModel();

  // images, created_by are immutable through this endpoint
  const { ...safe } = data as any;
  delete safe.images;
  delete safe.created_by;

  const doc = await Product.findByIdAndUpdate(id, { $set: safe }, { new: true, runValidators: true });
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);

  return toDetail(doc);
};

export const addImages = async (
  id: string,
  files: Express.Multer.File[]
): Promise<ProductDetail> => {
  assertValidId(id);
  const Product = await getProductModel();

  const doc = await Product.findById(id);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);

  const remaining = MAX_IMAGES - doc.images.length;
  if (remaining <= 0) throw new AppError(ERRORS.MAX_IMAGES, 400);

  const toUpload = files.slice(0, remaining);
  const results  = await Promise.all(toUpload.map((f) => uploadImageBuffer(f.buffer, IMAGE_FOLDER)));

  doc.images.push(...results.map((r) => ({ url: r.url, public_id: r.public_id }) as any));
  await doc.save();

  return toDetail(doc);
};

export const removeImage = async (id: string, imageId: string): Promise<ProductDetail> => {
  assertValidId(id);
  assertValidId(imageId, ERRORS.IMAGE_NOT_FOUND);

  const Product = await getProductModel();
  const doc = await Product.findById(id);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);

  const imgIndex = doc.images.findIndex((img) => img._id.toString() === imageId);
  if (imgIndex === -1) throw new AppError(ERRORS.IMAGE_NOT_FOUND, 404);

  const [removed] = doc.images.splice(imgIndex, 1);
  await doc.save();

  // Delete from Cloudinary after saving (never block save on cloud op)
  await deleteImageFromCloud(removed.public_id);

  return toDetail(doc);
};

export const deleteProduct = async (id: string): Promise<void> => {
  assertValidId(id);
  const Product = await getProductModel();

  const doc = await Product.findById(id);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);

  // Remove all Cloudinary images in parallel, then delete the DB record
  await Promise.all(doc.images.map((img) => deleteImageFromCloud(img.public_id)));
  await doc.deleteOne();

  logger.info('Product deleted', { productId: id });
};
