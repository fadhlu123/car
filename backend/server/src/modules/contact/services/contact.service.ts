import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getConversationModel, IConversation } from '../../../models/conversation.model';
import { getMessageModel } from '../../../models/message.model';
import { getUserModel } from '../../../models/user.model';
import { sseManager } from '../../notifications/sse/sse.manager';
import { notifyAdminNewChatMessage } from './contact.notify.service';
import { toConversationDTO, toMessageDTO, EDIT_WINDOW_MS } from './contact.mappers';
import { ConversationDTO, MessageDTO } from '../contact.types';
import { HydratedDocument } from 'mongoose';

const logger = createLogger('contact-service');

const ERRORS = {
  NOT_FOUND:      'Message not found',
  FORBIDDEN:      'You can only edit your own messages',
  WINDOW_ELAPSED: 'This message can no longer be edited',
} as const;

const resolveUserName = async (userId: string): Promise<string> => {
  const User = await getUserModel();
  const u = await User.findById(userId).select('profile.first_name profile.last_name').lean();
  const name = `${u?.profile?.first_name ?? ''} ${u?.profile?.last_name ?? ''}`.trim();
  return name || 'Customer';
};

const getOrCreateConversationDoc = async (userId: string): Promise<HydratedDocument<IConversation>> => {
  const Conversation = await getConversationModel();
  let convo = await Conversation.findOne({ user_id: userId });
  if (!convo) convo = await Conversation.create({ user_id: userId });
  return convo;
};

export const getOrCreateConversation = async (userId: string): Promise<ConversationDTO> => {
  const convo = await getOrCreateConversationDoc(userId);
  const Message = await getMessageModel();
  const messages = await Message.find({ conversation_id: convo._id }).sort({ created_at: 1 });

  // Mark admin messages as seen now that the user is viewing the thread
  const unseen = messages.filter((m) => m.sender_type === 'admin' && !m.seen_at);
  if (unseen.length) {
    const now = new Date();
    await Message.updateMany({ _id: { $in: unseen.map((m) => m._id) } }, { $set: { seen_at: now } });
    unseen.forEach((m) => { m.seen_at = now; });
  }

  return toConversationDTO(convo, messages, { type: 'user', id: userId });
};

export const postMessage = async (userId: string, body: string): Promise<MessageDTO> => {
  const convo = await getOrCreateConversationDoc(userId);
  const Message = await getMessageModel();
  const name = await resolveUserName(userId);

  const doc = await Message.create({
    conversation_id: convo._id,
    sender_type:     'user',
    sender_id:       new mongoose.Types.ObjectId(userId),
    sender_name:     name,
    body,
  });

  convo.last_message_at      = doc.created_at;
  convo.last_message_preview = body.slice(0, 200);
  await convo.save();

  const dto = toMessageDTO(doc, { type: 'user', id: userId });
  sseManager.pushToAllAdmins('chat_message', { conversation_id: convo._id.toString(), message: dto });

  notifyAdminNewChatMessage(name, body).catch((err: any) =>
    logger.error('Admin chat notification failed', { error: err?.message, stack: err?.stack })
  );

  return dto;
};

export const editMessage = async (userId: string, messageId: string, body: string): Promise<MessageDTO> => {
  const Message = await getMessageModel();
  const doc = await Message.findById(messageId);
  if (!doc) throw new AppError(ERRORS.NOT_FOUND, 404);
  if (doc.sender_type !== 'user' || doc.sender_id.toString() !== userId) {
    throw new AppError(ERRORS.FORBIDDEN, 403);
  }
  if (Date.now() - doc.created_at.getTime() > EDIT_WINDOW_MS) {
    throw new AppError(ERRORS.WINDOW_ELAPSED, 403);
  }

  doc.body      = body;
  doc.edited_at = new Date();
  await doc.save();

  const dto = toMessageDTO(doc, { type: 'user', id: userId });
  sseManager.pushToAllAdmins('chat_message', { conversation_id: doc.conversation_id.toString(), message: dto });

  return dto;
};

export const markSeenByUser = async (userId: string): Promise<void> => {
  const convo = await getOrCreateConversationDoc(userId);
  const Message = await getMessageModel();
  await Message.updateMany(
    { conversation_id: convo._id, sender_type: 'admin', seen_at: null },
    { $set: { seen_at: new Date() } }
  );
};
