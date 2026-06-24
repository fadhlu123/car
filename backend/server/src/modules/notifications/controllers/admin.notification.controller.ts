import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendCreated, sendNoContent } from '../../../utils/response.utils';
import { validate } from '../../../utils/request.utils';
import { withImageUpload as multerUpload, uploadImageBuffer } from '../../../utils/upload.utils';
import { sseManager } from '../sse/sse.manager';
import * as svc from '../services/admin.notification.service';

const pageSchema = z.object({
  page:  z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const broadcastSchema = z.object({
  title:     z.string().min(1, 'Title is required').max(200),
  body:      z.string().min(1, 'Body is required').max(1000),
  image_url: z.string().url().optional(),
  cta_url:   z.string().url().optional(),
  cta_label: z.string().max(50).optional(),
  audience:  z.enum(['all_users', 'verified_only']).default('all_users'),
});

const updateBroadcastSchema = broadcastSchema.partial().extend({
  is_active: z.boolean().optional(),
});

const broadcastUpload = multerUpload('image', 1);
const IMAGE_FOLDER = 'auto-majid/broadcasts';

// ── Admin SSE stream ──────────────────────────────────────────────────────────
export const streamAdminNotifications = (req: Request, res: Response): void => {
  res.setHeader('Content-Type',     'text/event-stream');
  res.setHeader('Cache-Control',    'no-cache');
  res.setHeader('Connection',       'keep-alive');
  res.setHeader('X-Accel-Buffering','no');
  res.flushHeaders();

  const adminId = req.admin!.sub;
  const cleanup = sseManager.subscribe(adminId, res, true);

  res.write('event: connected\ndata: {"status":"ok"}\n\n');

  req.on('close', cleanup);
};

// ── Admin notification feed ───────────────────────────────────────────────────
export const listAdminNotifications = [
  validate(pageSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as any;
      const feed = await svc.listAdminNotifications(req.admin!.sub, page, limit);
      sendSuccess(res, feed, 'Notifications retrieved');
    } catch (err) { next(err); }
  },
];

export const getAdminUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await svc.getAdminUnreadCount(req.admin!.sub);
    sendSuccess(res, { unread_count: count }, 'Unread count retrieved');
  } catch (err) { next(err); }
};

export const markAdminRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markAdminOneRead(req.params.id, req.admin!.sub);
    sendNoContent(res);
  } catch (err) { next(err); }
};

export const markAdminAllRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.markAdminAllRead(req.admin!.sub);
    sendNoContent(res);
  } catch (err) { next(err); }
};

// ── SSE stats (how many users/admins are live) ────────────────────────────────
export const liveStats = (_req: Request, res: Response, next: NextFunction) => {
  try {
    sendSuccess(res, {
      connected_users:  sseManager.connectedUsers,
      connected_admins: sseManager.connectedAdmins,
    }, 'Live connection stats');
  } catch (err) { next(err); }
};

// ── Broadcasts ────────────────────────────────────────────────────────────────
export const createBroadcast = [
  broadcastUpload,
  validate(broadcastSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (files.length > 0) {
        const uploaded = await uploadImageBuffer(files[0].buffer, IMAGE_FOLDER);
        req.body.image_url = uploaded.url;
      }
      const broadcast = await svc.createBroadcast(req.body, req.admin!.sub);
      sendCreated(res, broadcast, 'Broadcast published successfully');
    } catch (err) { next(err); }
  },
];

export const listBroadcasts = [
  validate(pageSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, limit } = req.query as any;
      const result = await svc.listBroadcasts(page, limit);
      sendSuccess(res, result, 'Broadcasts retrieved');
    } catch (err) { next(err); }
  },
];

export const updateBroadcast = [
  broadcastUpload,
  validate(updateBroadcastSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files = (req.files as Express.Multer.File[]) ?? [];
      if (files.length > 0) {
        const uploaded = await uploadImageBuffer(files[0].buffer, IMAGE_FOLDER);
        req.body.image_url = uploaded.url;
      }
      const broadcast = await svc.updateBroadcast(req.params.id, req.body);
      sendSuccess(res, broadcast, 'Broadcast updated');
    } catch (err) { next(err); }
  },
];

export const deleteBroadcast = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.deleteBroadcast(req.params.id);
    sendNoContent(res);
  } catch (err) { next(err); }
};
