import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getNotificationModel } from '../models/notification.model';
import { getBroadcastModel } from '../models/broadcast.model';
import { sseManager } from '../sse/sse.manager';
import { InAppNotification, BroadcastPayload, NotificationFeed } from '../types/notifications.types';

const logger = createLogger('admin-notification-service');

const ERRORS = {
  NOT_FOUND: 'Notification not found',
  BROADCAST_NOT_FOUND: 'Broadcast not found',
} as const;

const toInApp = (doc: any): InAppNotification => ({
  id:         doc._id.toString(),
  type:       doc.type,
  title:      doc.title,
  body:       doc.body,
  metadata:   doc.metadata,
  cta_url:    doc.cta_url,
  is_read:    doc.is_read,
  created_at: doc.created_at,
});

const toBroadcast = (doc: any): BroadcastPayload => ({
  id:           doc._id.toString(),
  title:        doc.title,
  body:         doc.body,
  image_url:    doc.image_url,
  cta_url:      doc.cta_url,
  cta_label:    doc.cta_label,
  audience:     doc.audience,
  is_active:    doc.is_active,
  published_by: doc.published_by.toString(),
  created_at:   doc.created_at,
});

// ── Admin personal notifications ──────────────────────────────────────────────

export const listAdminNotifications = async (
  adminId: string,
  page  = 1,
  limit = 20
): Promise<NotificationFeed> => {
  const Notification = await getNotificationModel();
  const skip = (page - 1) * limit;

  // Personal admin notifications + shared admin notifications (no recipient_id)
  const filter = {
    recipient_type: 'admin',
    $or: [
      { recipient_id: new mongoose.Types.ObjectId(adminId) },
      { recipient_id: { $exists: false } },
    ],
  };

  const [docs, total, unread_count] = await Promise.all([
    Notification.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, is_read: false }),
  ]);

  return {
    notifications: docs.map(toInApp),
    unread_count,
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

export const getAdminUnreadCount = async (adminId: string): Promise<number> => {
  const Notification = await getNotificationModel();
  return Notification.countDocuments({
    recipient_type: 'admin',
    is_read:        false,
    $or: [
      { recipient_id: new mongoose.Types.ObjectId(adminId) },
      { recipient_id: { $exists: false } },
    ],
  });
};

export const markAdminOneRead = async (notificationId: string, adminId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) throw new AppError(ERRORS.NOT_FOUND, 404);
  const Notification = await getNotificationModel();
  const result = await Notification.updateOne(
    {
      _id:            new mongoose.Types.ObjectId(notificationId),
      recipient_type: 'admin',
      $or: [
        { recipient_id: new mongoose.Types.ObjectId(adminId) },
        { recipient_id: { $exists: false } },
      ],
    },
    { $set: { is_read: true } }
  );
  if (result.matchedCount === 0) throw new AppError(ERRORS.NOT_FOUND, 404);
};

export const markAdminAllRead = async (adminId: string): Promise<void> => {
  const Notification = await getNotificationModel();
  await Notification.updateMany(
    {
      recipient_type: 'admin',
      is_read:        false,
      $or: [
        { recipient_id: new mongoose.Types.ObjectId(adminId) },
        { recipient_id: { $exists: false } },
      ],
    },
    { $set: { is_read: true } }
  );
};

// ── Broadcasts ────────────────────────────────────────────────────────────────

export interface CreateBroadcastInput {
  title:     string;
  body:      string;
  image_url?: string;
  cta_url?:  string;
  cta_label?: string;
  audience:  'all_users' | 'verified_only';
}

export const createBroadcast = async (
  data:    CreateBroadcastInput,
  adminId: string
): Promise<BroadcastPayload> => {
  const Broadcast = await getBroadcastModel();
  const doc = await Broadcast.create({
    ...data,
    published_by: new mongoose.Types.ObjectId(adminId),
  });

  const payload = toBroadcast(doc);

  // Real-time: push to all currently connected users
  sseManager.broadcastToAllUsers('broadcast', payload);
  logger.info('Broadcast published', { id: doc._id.toString(), adminId });

  return payload;
};

export const listBroadcasts = async (
  page  = 1,
  limit = 20
): Promise<{ broadcasts: BroadcastPayload[]; total: number; page: number; limit: number; total_pages: number }> => {
  const Broadcast = await getBroadcastModel();
  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    Broadcast.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Broadcast.countDocuments(),
  ]);
  return {
    broadcasts:  docs.map(toBroadcast),
    total,
    page,
    limit,
    total_pages: Math.ceil(total / limit),
  };
};

export const updateBroadcast = async (
  id:      string,
  updates: Partial<CreateBroadcastInput & { is_active: boolean }>
): Promise<BroadcastPayload> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(ERRORS.BROADCAST_NOT_FOUND, 404);
  const Broadcast = await getBroadcastModel();
  const doc = await Broadcast.findByIdAndUpdate(id, { $set: updates }, { new: true });
  if (!doc) throw new AppError(ERRORS.BROADCAST_NOT_FOUND, 404);

  // If deactivating, push a "broadcast_removed" event so clients can hide it live
  if (updates.is_active === false) {
    sseManager.broadcastToAllUsers('broadcast_removed', { id });
  }

  return toBroadcast(doc);
};

export const deleteBroadcast = async (id: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(ERRORS.BROADCAST_NOT_FOUND, 404);
  const Broadcast = await getBroadcastModel();
  const result = await Broadcast.deleteOne({ _id: id });
  if (result.deletedCount === 0) throw new AppError(ERRORS.BROADCAST_NOT_FOUND, 404);
  sseManager.broadcastToAllUsers('broadcast_removed', { id });
};
