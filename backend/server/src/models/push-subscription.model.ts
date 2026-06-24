import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPushSubscription extends Document {
  user_id:        Types.ObjectId;
  recipient_type: 'user' | 'admin';
  endpoint:       string;
  keys:           { p256dh: string; auth: string };
  user_agent:     string;
  created_at:     Date;
}

const schema = new Schema<IPushSubscription>(
  {
    user_id:        { type: Schema.Types.ObjectId, required: true, index: true },
    recipient_type: { type: String, enum: ['user', 'admin'], default: 'user' },
    endpoint:       { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth:   { type: String, required: true },
    },
    user_agent: { type: String, default: '' },
    created_at: { type: Date, default: Date.now },
  },
  { timestamps: false, versionKey: false }
);

schema.index({ recipient_type: 1 });

let _model: mongoose.Model<IPushSubscription> | null = null;

export const getPushSubscriptionModel = async (): Promise<mongoose.Model<IPushSubscription>> => {
  if (_model) return _model;
  _model = mongoose.models.PushSubscription || mongoose.model<IPushSubscription>('PushSubscription', schema);
  return _model;
};
