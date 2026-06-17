import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import * as svc from '../services/admin.order.service';

const listQuerySchema = z.object({
  page:      z.coerce.number().int().min(1).optional(),
  limit:     z.coerce.number().int().min(1).max(100).optional(),
  status:    z.enum(['pending', 'contacted', 'completed', 'cancelled']).optional(),
  email:     z.string().optional(),
  date_from: z.string().optional(),
  date_to:   z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['contacted', 'completed', 'cancelled'], {
    required_error: 'Status is required',
    invalid_type_error: "Status must be one of: contacted, completed, cancelled",
  }),
  notes: z.string().max(500).optional(),
});

export const listOrders = [
  validate(listQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.listOrders(req.query as any);
      sendSuccess(res, result, 'Orders retrieved');
    } catch (err) { next(err); }
  },
];

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await svc.getOrder(req.params.id);
    sendSuccess(res, order, 'Order retrieved');
  } catch (err) { next(err); }
};

export const updateOrderStatus = [
  validate(updateStatusSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await svc.updateOrderStatus(
        req.params.id,
        req.body.status,
        req.admin!.sub,
        req.body.notes
      );
      sendSuccess(res, order, 'Order status updated');
    } catch (err) { next(err); }
  },
];
