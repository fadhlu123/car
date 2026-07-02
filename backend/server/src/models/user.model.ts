import mongoose, { Schema, Document, Model } from 'mongoose';
import { AuthProvider, UserRole, AdminRole } from '../modules/auth/types/auth.types';

export interface IUser extends Document {
  email: string;
  password_hash?: string;
  role: UserRole;
  /** Only set when role === 'admin'. 'owner' = added via ADMIN_EMAILS env; 'staff' = invited. */
  admin_role?: AdminRole;
  providers: Array<{ provider: AuthProvider; provider_id: string }>;
  profile: { first_name: string; last_name: string; avatar_url: string; avatar_public_id?: string };
  email_verified: boolean;
  is_active: boolean;
  failed_login_attempts: number;
  locked_until?: Date;
  last_login?: Date;
  created_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String },
    role:          { type: String, enum: ['user', 'admin'], default: 'user' },
    admin_role:    { type: String, enum: ['owner', 'staff'] },
    providers: [
      {
        provider:    { type: String, enum: ['local', 'google'], required: true },
        provider_id: { type: String, required: true },
      },
    ],
    profile: {
      first_name:       { type: String, default: '' },
      last_name:        { type: String, default: '' },
      avatar_url:       { type: String, default: '' },
      avatar_public_id: { type: String },
    },
    email_verified:        { type: Boolean, default: false },
    is_active:             { type: Boolean, default: true },
    failed_login_attempts: { type: Number,  default: 0 },
    locked_until:          { type: Date },
    last_login:            { type: Date },
    created_at:            { type: Date, default: Date.now },
  },
  { versionKey: false }
);

let _User: Model<IUser> | null = null;

export const getUserModel = async (): Promise<Model<IUser>> => {
  if (_User) return _User;
  _User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
  return _User;
};
