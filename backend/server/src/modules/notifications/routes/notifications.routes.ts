import { Router } from 'express';
import {
  protect,
  protectSSE,
  adminProtect,
  adminProtectSSE,
  ownerProtect,
  optionalProtect,
} from '../../auth/middleware/auth.middleware';
import * as userCtrl  from '../controllers/notification.controller';
import * as adminCtrl from '../controllers/admin.notification.controller';
import * as pushCtrl  from '../controllers/push.controller';

const router = Router();

// ─── User: SSE stream ─────────────────────────────────────────────────────────
// Must be registered before body-parsing — SSE keeps the connection open
router.get('/notifications/stream', protectSSE, userCtrl.streamNotifications);

// ─── User: in-app notifications ───────────────────────────────────────────────
router.get(  '/notifications',                   protect, ...userCtrl.listNotifications);
router.get(  '/notifications/unread-count',      protect, userCtrl.getUnreadCount);
router.get(  '/notifications/broadcasts',        optionalProtect, userCtrl.listBroadcasts);
router.patch('/notifications/:id/read',          protect, userCtrl.markRead);
router.patch('/notifications/read-all',          protect, userCtrl.markAllRead);

// ─── Admin: SSE stream ────────────────────────────────────────────────────────
router.get('/admin/notifications/stream', adminProtectSSE, adminCtrl.streamAdminNotifications);

// ─── Admin: in-app notifications ──────────────────────────────────────────────
router.get(  '/admin/notifications',              adminProtect, ...adminCtrl.listAdminNotifications);
router.get(  '/admin/notifications/unread-count', adminProtect, adminCtrl.getAdminUnreadCount);
router.patch('/admin/notifications/:id/read',     adminProtect, adminCtrl.markAdminRead);
router.patch('/admin/notifications/read-all',     adminProtect, adminCtrl.markAdminAllRead);
router.get(  '/admin/notifications/live-stats',   adminProtect, adminCtrl.liveStats);

// ─── Admin: broadcasts ────────────────────────────────────────────────────────
// Owner can delete; any admin can publish/update
router.get(   '/admin/notifications/broadcasts',      adminProtect, ...adminCtrl.listBroadcasts);
router.post(  '/admin/notifications/broadcasts',      adminProtect, ...adminCtrl.createBroadcast);
router.patch( '/admin/notifications/broadcasts/:id',  adminProtect, ...adminCtrl.updateBroadcast);
router.delete('/admin/notifications/broadcasts/:id',  ownerProtect, adminCtrl.deleteBroadcast);

// ─── Push notifications (user) ────────────────────────────────────────────────
router.get(   '/notifications/push/vapid-key',   pushCtrl.getVapidKey);
router.post(  '/notifications/push/subscribe',   protect,      ...pushCtrl.subscribePush);
router.delete('/notifications/push/unsubscribe', protect,      ...pushCtrl.unsubscribePush);

// ─── Push notifications (admin) ───────────────────────────────────────────────
router.post(  '/admin/notifications/push/subscribe',   adminProtect, ...pushCtrl.adminSubscribePush);
router.delete('/admin/notifications/push/unsubscribe', adminProtect, ...pushCtrl.adminUnsubscribePush);

export default router;
