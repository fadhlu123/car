import mongoose, { Schema, Document, Types } from 'mongoose';
import { databaseManager } from '../../../configs/database.config';
import { NOTIFICATIONS_DB } from './notification.model';

export interface IBroadcast extends Document {
  title:        string;
  body:         string;
  image_url?:   string;
  cta_url?:     string;
  cta_label?:   string;
  audience:     'all_users' | 'verified_only';
  is_active:    boolean;
  published_by: Types.ObjectId;
  created_at:   Date;
  updated_at:   Date;
}

const BroadcastSchema = new Schema<IBroadcast>(
  {
    title:        { type: String, required: true, maxlength: 200 },
    body:         { type: String, required: true, maxlength: 1000 },
    image_url:    { type: String, maxlength: 500 },
    cta_url:      { type: String, maxlength: 500 },
    cta_label:    { type: String, maxlength: 50 },
    audience:     { type: String, required: true, enum: ['all_users', 'verified_only'], default: 'all_users' },
    is_active:    { type: Boolean, default: true },
    published_by: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

BroadcastSchema.index({ is_active: 1, created_at: -1 });

let _Broadcast: mongoose.Model<IBroadcast> | null = null;

export const getBroadcastModel = async (): Promise<mongoose.Model<IBroadcast>> => {
  if (_Broadcast) return _Broadcast;
  const conn = await databaseManager.getConnection(NOTIFICATIONS_DB);
  _Broadcast = conn.model<IBroadcast>('Broadcast', BroadcastSchema);
  return _Broadcast;
};
