import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendCreated, sendNoContent } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import { withImageUpload as multerUpload } from '../../../utils/upload.utils';
import * as svc from '../services/admin.product.service';

const CURRENT_YEAR = new Date().getFullYear();

// Multipart fields arrive as strings — coerce numbers accordingly
const createSchema = z.object({
  name:         z.string().min(1, 'Name is required').max(200),
  description:  z.string().min(1, 'Description is required').max(2000),
  price:        z.coerce.number().min(0, 'Price must be non-negative'),
  currency:     z.enum(['GHS', 'USD', 'EUR']).optional(),
  condition:    z.enum(['new', 'used'], { required_error: 'Condition is required' }),
  availability: z.enum(['available', 'sold', 'reserved']).optional(),
  category:     z.string().min(1, 'Category is required'),
  make:         z.string().min(1, 'Make is required'),
  model:        z.string().min(1, 'Model is required'),
  year:         z.coerce.number().int().min(1900).max(CURRENT_YEAR + 2, `Year cannot exceed ${CURRENT_YEAR + 2}`),
  mileage:      z.coerce.number().min(0).optional(),
  colour:       z.string().max(50).optional(),
  // Multer sends repeated fields as an array, a single field as a string
  features: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (!v) return [];
      return Array.isArray(v) ? v : [v];
    }),
  is_published: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => v === true || v === 'true'),
});

const updateSchema = createSchema.partial();

const adminListQuerySchema = z.object({
  page:         z.coerce.number().int().min(1).optional(),
  limit:        z.coerce.number().int().min(1).max(100).optional(),
  condition:    z.enum(['new', 'used']).optional(),
  availability: z.enum(['available', 'sold', 'reserved']).optional(),
  category:     z.string().optional(),
  make:         z.string().optional(),
  min_price:    z.coerce.number().min(0).optional(),
  max_price:    z.coerce.number().min(0).optional(),
  search:       z.string().optional(),
  is_published: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      return v === true || v === 'true';
    }),
});

export const listAllProducts = [
  validate(adminListQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.listAllProducts(req.query as any);
      sendSuccess(res, result, 'Products retrieved');
    } catch (err) { next(err); }
  },
];

export const getProductAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await svc.getProductAdmin(req.params.id);
    sendSuccess(res, product, 'Product retrieved');
  } catch (err) { next(err); }
};

export const createProduct = [
  multerUpload('images', 10),
  validate(createSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      const product = await svc.createProduct(req.body, req.admin!.sub, files);
      sendCreated(res, product, 'Product created');
    } catch (err) { next(err); }
  },
];

export const updateProduct = [
  validate(updateSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await svc.updateProduct(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated');
    } catch (err) { next(err); }
  },
];

export const addImages = [
  multerUpload('images', 10),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (files.length === 0) {
        res.status(400).json({ success: false, message: 'No images provided', data: null });
        return;
      }
      const product = await svc.addImages(req.params.id, files);
      sendSuccess(res, product, 'Images added');
    } catch (err) { next(err); }
  },
];

export const removeImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await svc.removeImage(req.params.id, req.params.imageId);
    sendSuccess(res, product, 'Image removed');
  } catch (err) { next(err); }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deleteProduct(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
};
