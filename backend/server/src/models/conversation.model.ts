import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IConversation extends Document {
  user_id:               Types.ObjectId;
  last_message_at?:      Date;
  last_message_preview?: string;
  created_at:            Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    user_id:              { type: Schema.Types.ObjectId, required: true, unique: true, index: true },
    last_message_at:      { type: Date },
    last_message_preview: { type: String, maxlength: 200 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false }, versionKey: false }
);

let _Conversation: Model<IConversation> | null = null;

export const getConversationModel = async (): Promise<Model<IConversation>> => {
  if (_Conversation) return _Conversation;
  _Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);
  return _Conversation;
};
