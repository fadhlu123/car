import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import * as svc from '../services/product.service';

const listQuerySchema = z.object({
  page:         z.coerce.number().int().min(1).optional(),
  limit:        z.coerce.number().int().min(1).max(50).optional(),
  condition:    z.enum(['new', 'used']).optional(),
  availability: z.enum(['available', 'sold', 'reserved']).optional(),
  category:     z.string().optional(),
  make:         z.string().optional(),
  min_price:    z.coerce.number().min(0).optional(),
  max_price:    z.coerce.number().min(0).optional(),
  search:       z.string().optional(),
});

export const listProducts = [
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.listProducts(req.query as any);
      sendSuccess(res, result, 'Products retrieved');
    } catch (err) { next(err); }
  },
];

export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await svc.getProduct(req.params.id);
    sendSuccess(res, product, 'Product retrieved');
  } catch (err) { next(err); }
};
