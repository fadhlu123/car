import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IMessage extends Document {
  conversation_id: Types.ObjectId;
  sender_type:     'user' | 'admin';
  sender_id:       Types.ObjectId;
  sender_name:     string;
  /** Only set when sender_type === 'admin' — lets us show customers a role tag
   *  ("Owner"/"Staff") instead of the individual admin's real name. */
  sender_role?:    'owner' | 'staff';
  body:            string;
  edited_at?:      Date;
  seen_at?:        Date;
  created_at:      Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation_id: { type: Schema.Types.ObjectId, required: true, index: true },
    sender_type:      { type: String, required: true, enum: ['user', 'admin'] },
    sender_id:        { type: Schema.Types.ObjectId, required: true },
    sender_name:      { type: String, required: true, maxlength: 120 },
    sender_role:      { type: String, enum: ['owner', 'staff'] },
    body:             { type: String, required: true, maxlength: 2000 },
    edited_at:        { type: Date },
    seen_at:          { type: Date },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false }
);

MessageSchema.index({ conversation_id: 1, created_at: 1 });

let _Message: Model<IMessage> | null = null;

export const getMessageModel = async (): Promise<Model<IMessage>> => {
  if (_Message) return _Message;
  _Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);
  return _Message;
};
