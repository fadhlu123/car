import mongoose, { Schema, Document, Types } from 'mongoose';
import { databaseManager } from '../../../configs/database.config';
import { NotificationType } from '../types/notifications.types';

export const NOTIFICATIONS_DB = 'auto-majid-notifications';

export interface INotification extends Document {
  // Null means "all admins" (shared admin-panel notifications like new_order)
  recipient_id?:  Types.ObjectId;
  recipient_type: 'user' | 'admin';
  type:           NotificationType;
  title:          string;
  body:           string;
  metadata?:      Record<string, unknown>;
  cta_url?:       string;
  is_read:        boolean;
  created_at:     Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient_id:   { type: Schema.Types.ObjectId, index: true },
    recipient_type: { type: String, required: true, enum: ['user', 'admin'] },
    type:           { type: String, required: true },
    title:          { type: String, required: true, maxlength: 200 },
    body:           { type: String, required: true, maxlength: 1000 },
    metadata:       { type: Schema.Types.Mixed },
    cta_url:        { type: String, maxlength: 500 },
    is_read:        { type: Boolean, default: false },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } }
);

NotificationSchema.index({ recipient_id: 1, is_read: 1, created_at: -1 });
NotificationSchema.index({ recipient_type: 1, is_read: 1, created_at: -1 });

let _Notification: mongoose.Model<INotification> | null = null;

export const getNotificationModel = async (): Promise<mongoose.Model<INotification>> => {
  if (_Notification) return _Notification;
  const conn = await databaseManager.getConnection(NOTIFICATIONS_DB);
  _Notification = conn.model<INotification>('Notification', NotificationSchema);
  return _Notification;
};
