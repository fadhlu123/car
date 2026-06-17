import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { getNotificationModel } from '../models/notification.model';
import { getBroadcastModel } from '../models/broadcast.model';
import { InAppNotification, BroadcastPayload, NotificationFeed } from '../types/notifications.types';

const ERRORS = {
  NOT_FOUND: 'Notification not found',
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

// ── User: list personal notifications (newest first) ─────────────────────────
export const listUserNotifications = async (
  userId: string,
  page = 1,
  limit = 20
): Promise<NotificationFeed> => {
  const Notification = await getNotificationModel();
  const skip = (page - 1) * limit;
  const filter = { recipient_id: new mongoose.Types.ObjectId(userId), recipient_type: 'user' };

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

export const getUserUnreadCount = async (userId: string): Promise<number> => {
  const Notification = await getNotificationModel();
  return Notification.countDocuments({
    recipient_id:   new mongoose.Types.ObjectId(userId),
    recipient_type: 'user',
    is_read:        false,
  });
};

export const markOneRead = async (notificationId: string, userId: string): Promise<void> => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) throw new AppError(ERRORS.NOT_FOUND, 404);
  const Notification = await getNotificationModel();
  const result = await Notification.updateOne(
    {
      _id:            new mongoose.Types.ObjectId(notificationId),
      recipient_id:   new mongoose.Types.ObjectId(userId),
      recipient_type: 'user',
    },
    { $set: { is_read: true } }
  );
  if (result.matchedCount === 0) throw new AppError(ERRORS.NOT_FOUND, 404);
};

export const markAllRead = async (userId: string): Promise<void> => {
  const Notification = await getNotificationModel();
  await Notification.updateMany(
    { recipient_id: new mongoose.Types.ObjectId(userId), recipient_type: 'user', is_read: false },
    { $set: { is_read: true } }
  );
};

// ── Broadcasts (active announcements visible to all users) ────────────────────
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

export const listActiveBroadcasts = async (
  isEmailVerified = false
): Promise<BroadcastPayload[]> => {
  const Broadcast = await getBroadcastModel();
  const audienceFilter = isEmailVerified
    ? { $in: ['all_users', 'verified_only'] }
    : 'all_users';

  const docs = await Broadcast
    .find({ is_active: true, audience: audienceFilter })
    .sort({ created_at: -1 })
    .limit(50)
    .lean();

  return docs.map(toBroadcast);
};
