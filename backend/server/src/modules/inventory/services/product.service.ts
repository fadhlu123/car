import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getProductModel } from '../../../models/product.model';
import { toSummary, toDetail } from './product.mappers';
import { ListProductsQuery, ListResult, ProductDetail } from '../types/inventory.types';

const logger = createLogger('product-service');

const ERRORS = {
  NOT_FOUND:  'Product not found',
  INVALID_ID: 'Invalid product ID',
} as const;

const buildPublicFilter = (query: ListProductsQuery): Record<string, unknown> => {
  const filter: Record<string, unknown> = { is_published: true };

  if (query.condition)    filter.condition    = query.condition;
  if (query.availability) filter.availability = query.availability;
  if (query.category)     filter.category     = new RegExp(query.category, 'i');
  if (query.make)         filter.make         = new RegExp(query.make, 'i');

  if (query.min_price !== undefined || query.max_price !== undefined) {
    const priceFilter: Record<string, number> = {};
    if (query.min_price !== undefined) priceFilter.$gte = query.min_price;
    if (query.max_price !== undefined) priceFilter.$lte = query.max_price;
    filter.price = priceFilter;
  }

  if (query.search) filter.$text = { $search: query.search };

  return filter;
};

export const listProducts = async (query: ListProductsQuery): Promise<ListResult> => {
  const Product = await getProductModel();
  const page    = Math.max(1, query.page  ?? 1);
  const limit   = Math.min(50, Math.max(1, query.limit ?? 20));
  const skip    = (page - 1) * limit;
  const filter  = buildPublicFilter(query);

  const [docs, total] = await Promise.all([
    Product.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  logger.debug('listProducts', { filter, total });

  return {
    products:    docs.map(toSummary as any),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

export const getProduct = async (id: string): Promise<ProductDetail> => {
  const Product = await getProductModel();

  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(ERRORS.INVALID_ID, 400);

  const doc = await Product.findOne({ _id: id, is_published: true });
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);

  return toDetail(doc);
};
