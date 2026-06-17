import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../../utils/error.utils';
import { validate } from '../../../utils/request.utils';
import { getVapidPublicKey, saveSubscription, removeSubscription } from '../services/push.service';

const ERRORS = {
  VAPID_NOT_CONFIGURED: 'Push notifications are not enabled on this server',
} as const;

// ── GET /notifications/push/vapid-key ─────────────────────────────────────────

export const getVapidKey = (req: Request, res: Response): void => {
  const key = getVapidPublicKey();
  if (!key) throw new AppError(ERRORS.VAPID_NOT_CONFIGURED, 503);
  res.json({ success: true, message: 'VAPID public key', data: { public_key: key } });
};

// ── Shared schemas ────────────────────────────────────────────────────────────

const subscribeSchema = z.object({
  endpoint: z.string().url('endpoint must be a valid URL'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth:   z.string().min(1),
  }),
});

const unsubscribeSchema = z.object({ endpoint: z.string().url() });

// ── POST /notifications/push/subscribe (users) ────────────────────────────────

export const subscribePush = [
  validate(subscribeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId             = (req as any).user.id as string;
      const { endpoint, keys } = req.body as z.infer<typeof subscribeSchema>;
      await saveSubscription(userId, 'user', endpoint, keys, req.headers['user-agent']);
      res.status(201).json({ success: true, message: 'Push subscription saved', data: null });
    } catch (err) { next(err); }
  },
];

// ── DELETE /notifications/push/unsubscribe (users) ────────────────────────────

export const unsubscribePush = [
  validate(unsubscribeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId       = (req as any).user.id as string;
      const { endpoint } = req.body as z.infer<typeof unsubscribeSchema>;
      await removeSubscription(userId, endpoint);
      res.json({ success: true, message: 'Push subscription removed', data: null });
    } catch (err) { next(err); }
  },
];

// ── POST /admin/notifications/push/subscribe ──────────────────────────────────

export const adminSubscribePush = [
  validate(subscribeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId            = (req as any).admin.id as string;
      const { endpoint, keys } = req.body as z.infer<typeof subscribeSchema>;
      await saveSubscription(adminId, 'admin', endpoint, keys, req.headers['user-agent']);
      res.status(201).json({ success: true, message: 'Admin push subscription saved', data: null });
    } catch (err) { next(err); }
  },
];

// ── DELETE /admin/notifications/push/unsubscribe ──────────────────────────────

export const adminUnsubscribePush = [
  validate(unsubscribeSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const adminId      = (req as any).admin.id as string;
      const { endpoint } = req.body as z.infer<typeof unsubscribeSchema>;
      await removeSubscription(adminId, endpoint);
      res.json({ success: true, message: 'Admin push subscription removed', data: null });
    } catch (err) { next(err); }
  },
];
