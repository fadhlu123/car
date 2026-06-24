import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type InviteStatus = 'pending' | 'accepted' | 'revoked';

export interface IAdminInvite extends Document {
  email: string;
  token_hash: string;         // SHA-256 of the random invite token
  invited_by: Types.ObjectId;
  status: InviteStatus;
  expires_at: Date;
  accepted_at?: Date;
  created_at: Date;
}

const AdminInviteSchema = new Schema<IAdminInvite>(
  {
    email:       { type: String, required: true, lowercase: true, trim: true },
    token_hash:  { type: String, required: true, unique: true },
    invited_by:  { type: Schema.Types.ObjectId, required: true },
    status:      { type: String, enum: ['pending', 'accepted', 'revoked'], default: 'pending' },
    expires_at:  { type: Date, required: true, index: { expireAfterSeconds: 0 } },
    accepted_at: { type: Date },
    created_at:  { type: Date, default: Date.now },
  },
  { versionKey: false }
);

AdminInviteSchema.index({ email: 1, status: 1 });

let _AdminInvite: Model<IAdminInvite> | null = null;

export const getAdminInviteModel = async (): Promise<Model<IAdminInvite>> => {
  if (_AdminInvite) return _AdminInvite;
  _AdminInvite = mongoose.models.AdminInvite || mongoose.model<IAdminInvite>('AdminInvite', AdminInviteSchema);
  return _AdminInvite;
};
