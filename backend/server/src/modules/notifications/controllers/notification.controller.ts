import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendNoContent } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import { sseManager } from '../sse/sse.manager';
import * as svc from '../services/notification.service';

const pageSchema = z.object({
  page:  z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

// ── SSE stream — keep-alive connection ────────────────────────────────────────
export const streamNotifications = (req: Request, res: Response): void => {
  res.setHeader('Content-Type',     'text/event-stream');
  res.setHeader('Cache-Control',    'no-cache');
  res.setHeader('Connection',       'keep-alive');
  res.setHeader('X-Accel-Buffering','no');  // nginx: disable response buffering
  res.flushHeaders();

  const userId  = req.user!.sub;
  const cleanup = sseManager.subscribe(userId, res, false);

  // Confirm subscription
  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  req.on('close', cleanup);
};

// ── Notification feed ─────────────────────────────────────────────────────────
export const listNotifications = [
  validate(pageSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as any;
      const feed = await svc.listUserNotifications(req.user!.sub, page, limit);
      sendSuccess(res, feed, 'Notifications retrieved');
    } catch (err) { next(err); }
  },
];

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await svc.getUserUnreadCount(req.user!.sub);
    sendSuccess(res, { unread_count: count }, 'Unread count retrieved');
  } catch (err) { next(err); }
};

export const markRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markOneRead(req.params.id, req.user!.sub);
    sendNoContent(res);
  } catch (err) { next(err); }
};

export const markAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markAllRead(req.user!.sub);
    sendNoContent(res);
  } catch (err) { next(err); }
};

// ── Broadcasts (active announcements) ────────────────────────────────────────
export const listBroadcasts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isVerified = req.user?.email !== undefined; // any authenticated user = email on JWT
    const list = await svc.listActiveBroadcasts(isVerified);
    sendSuccess(res, list, 'Broadcasts retrieved');
  } catch (err) { next(err); }
};
