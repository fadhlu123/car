import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendCreated } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import * as svc from '../services/order.service';

const itemSchema = z.object({
  product_id: z.string().min(1, 'product_id is required'),
  name:       z.string().min(1).max(200),
  price:      z.number().min(0, 'Price must be non-negative'),
  currency:   z.enum(['GHS', 'USD', 'EUR']).default('GHS'),
  quantity:   z.number().int().min(1).max(100),
});

const customerSchema = z.object({
  name:  z.string().min(1, 'Customer name is required').max(100),
  phone: z.string().min(7, 'Phone number is too short').max(20),
  email: z.string().email('Please provide a valid email address'),
  notes: z.string().max(1000).optional(),
});

const submitSchema = z.object({
  items:    z.array(itemSchema).min(1, 'Order must contain at least one item').max(50),
  customer: customerSchema,
});

export const submitOrder = [
  validate(submitSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Attach userId if the request carries a valid user token (optionalProtect ran before this)
      const userId = req.user?.sub;
      const order  = await svc.submitOrder(req.body, userId);
      sendCreated(res, order, 'Order submitted successfully. We will be in touch shortly.');
    } catch (err) { next(err); }
  },
];
