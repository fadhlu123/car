import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendNoContent } from '../../../utils/response.utils';
import { validate, extractDeviceContext } from '../../../utils/request.utils';
import * as svc from '../services/admin.users.service';

const listSchema = z.object({
  page:   z.coerce.number().int().min(1).default(1),
  limit:  z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  role:   z.enum(['user', 'admin']).optional(),
  active: z.enum(['true', 'false']).optional(),
});

const idSchema = z.object({ id: z.string().min(1) });

export const listUsers = [
  validate(listSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = req.query as any;
      const result = await svc.listUsers({
        page:   Number(q.page),
        limit:  Number(q.limit),
        search: q.search,
        role:   q.role,
        active: q.active !== undefined ? q.active === 'true' : undefined,
      });
      sendSuccess(res, result, 'Users retrieved');
    } catch (err) { next(err); }
  },
];

export const getUserDetail = [
  validate(idSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.getUserDetail(req.params.id);
      sendSuccess(res, result, 'User retrieved');
    } catch (err) { next(err); }
  },
];

export const unlockAccount = [
  validate(idSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.unlockAccount(req.params.id, req.admin!.sub, req.admin!.admin_role, extractDeviceContext(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },
];

export const deactivateAccount = [
  validate(idSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.deactivateAccount(req.params.id, req.admin!.sub, req.admin!.admin_role, extractDeviceContext(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },
];

export const activateAccount = [
  validate(idSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.activateAccount(req.params.id, req.admin!.sub, req.admin!.admin_role, extractDeviceContext(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },
];
