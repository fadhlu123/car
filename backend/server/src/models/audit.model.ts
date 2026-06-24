import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { AuditEvent } from '../modules/auth/types/auth.types';

export interface IAudit extends Document {
  user_id?: Types.ObjectId;
  email?: string;
  event: AuditEvent;
  success: boolean;
  ip: string;
  user_agent: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

const AuditSchema = new Schema<IAudit>(
  {
    user_id:    { type: Schema.Types.ObjectId, index: true },
    email:      { type: String, index: true },
    event:      { type: String, required: true, index: true },
    success:    { type: Boolean, required: true },
    ip:         { type: String, default: 'unknown' },
    user_agent: { type: String, default: 'unknown' },
    metadata:   { type: Schema.Types.Mixed },
    created_at: { type: Date, default: Date.now, index: true },
  },
  { versionKey: false }
);

let _Audit: Model<IAudit> | null = null;

export const getAuditModel = async (): Promise<Model<IAudit>> => {
  if (_Audit) return _Audit;
  _Audit = mongoose.models.Audit || mongoose.model<IAudit>('Audit', AuditSchema);
  return _Audit;
};
