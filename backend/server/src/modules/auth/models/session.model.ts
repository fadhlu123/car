import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { databaseManager } from '../../../configs/database.config';
import { USER_DB } from './user.model';

export interface ISession extends Document {
  user_id: Types.ObjectId;
  token_hash: string;      // SHA-256 of the refresh JWT — raw token never persisted
  is_admin: boolean;
  device_info: { ip: string; user_agent: string; device_type: string };
  expires_at: Date;
  revoked_at?: Date;
  created_at: Date;
}

const SessionSchema = new Schema<ISession>(
  {
    user_id:    { type: Schema.Types.ObjectId, required: true, index: true },
    token_hash: { type: String, required: true },
    is_admin:   { type: Boolean, default: false },
    device_info: {
      ip:          { type: String, default: 'unknown' },
      user_agent:  { type: String, default: 'unknown' },
      device_type: { type: String, default: 'unknown' },
    },
    expires_at: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    revoked_at: { type: Date },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

let _Session: Model<ISession> | null = null;

export const getSessionModel = async (): Promise<Model<ISession>> => {
  if (_Session) return _Session;
  const conn = await databaseManager.getConnection(USER_DB);
  _Session = conn.model<ISession>('Session', SessionSchema);
  return _Session;
};
