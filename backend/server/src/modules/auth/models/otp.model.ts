import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { databaseManager } from '../../../configs/database.config';
import { OtpType } from '../types/auth.types';
import { USER_DB } from './user.model';

export interface IOtp extends Document {
  user_id: Types.ObjectId;
  type: OtpType;
  code_hash: string;   // SHA-256 of the 6-digit code
  expires_at: Date;
  used_at?: Date;
  attempts: number;    // failed verification attempts
  created_at: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    user_id:    { type: Schema.Types.ObjectId, required: true },
    type:       { type: String, enum: ['email_verification', 'password_reset'], required: true },
    code_hash:  { type: String, required: true },
    expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    used_at:    { type: Date },
    attempts:   { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

OtpSchema.index({ user_id: 1, type: 1 });

let _Otp: Model<IOtp> | null = null;

export const getOtpModel = async (): Promise<Model<IOtp>> => {
  if (_Otp) return _Otp;
  const conn = await databaseManager.getConnection(USER_DB);
  _Otp = conn.model<IOtp>('Otp', OtpSchema);
  return _Otp;
};
