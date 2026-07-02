import mongoose from 'mongoose';
import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { getConversationModel } from '../../../models/conversation.model';
import { getMessageModel } from '../../../models/message.model';
import { getUserModel } from '../../../models/user.model';
import { sseManager } from '../../notifications/sse/sse.manager';
import { notifyUserChatReply } from './contact.notify.service';
import { toConversationDTO, toMessageDTO } from './contact.mappers';
import {
  ConversationDTO,
  ConversationSummaryDTO,
  MessageDTO,
  AdminListConversationsQuery,
} from '../contact.types';

const logger = createLogger('admin-contact-service');

const ERRORS = {
  NOT_FOUND:  'Conversation not found',
  INVALID_ID: 'Invalid conversation ID',
} as const;

const assertValidId = (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new AppError(ERRORS.INVALID_ID, 400);
};

const resolveAdminName = async (adminId: string): Promise<string> => {
  const User = await getUserModel();
  const a = await User.findById(adminId).select('profile.first_name profile.last_name').lean();
  const name = `${a?.profile?.first_name ?? ''} ${a?.profile?.last_name ?? ''}`.trim();
  return name || 'Support Team';
};

export const listConversations = async (
  query: AdminListConversationsQuery
): Promise<{
  conversations: ConversationSummaryDTO[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}> => {
  const Conversation = await getConversationModel();
  const Message      = await getMessageModel();
  const User         = await getUserModel();

  const page  = Math.max(1, query.page ?? 1);
  const limit = Math.min(100, Math.max(1, query.limit ?? 20));
  const skip  = (page - 1) * limit;

  const [convos, total] = await Promise.all([
    Conversation.find().sort({ last_message_at: -1, created_at: -1 }).skip(skip).limit(limit).lean(),
    Conversation.countDocuments(),
  ]);

  const userIds = convos.map((c) => c.user_id);
  const users = await User.find({ _id: { $in: userIds } }).select('email profile.first_name profile.last_name').lean();
  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  // "unread" = the newest message is from the customer and no admin has seen it yet
  const conversationIds = convos.map((c) => c._id);
  const unreadMessages = await Message.find({
    conversation_id: { $in: conversationIds },
    sender_type:     'user',
    seen_at:         null,
  }).select('conversation_id').lean();
  const unreadSet = new Set(unreadMessages.map((m) => m.conversation_id.toString()));

  const conversations: ConversationSummaryDTO[] = convos.map((c) => {
    const u = userMap.get(c.user_id.toString());
    return {
      id: c._id.toString(),
      user: {
        id:    c.user_id.toString(),
        name:  `${u?.profile?.first_name ?? ''} ${u?.profile?.last_name ?? ''}`.trim() || 'Customer',
        email: u?.email ?? '',
      },
      last_message_at:      c.last_message_at ?? null,
      last_message_preview: c.last_message_preview ?? null,
      unread:                unreadSet.has(c._id.toString()),
    };
  });

  return { conversations, total, page, limit, total_pages: Math.ceil(total / limit) };
};

export const getConversation = async (id: string, adminId: string): Promise<ConversationDTO> => {
  assertValidId(id);
  const Conversation = await getConversationModel();
  const Message      = await getMessageModel();

  const convo = await Conversation.findById(id);
  if (!convo) throw new AppError(ERRORS.NOT_FOUND, 404);

  const messages = await Message.find({ conversation_id: convo._id }).sort({ created_at: 1 });
  return toConversationDTO(convo, messages, { type: 'admin', id: adminId });
};

export const postAdminReply = async (
  id: string,
  adminId: string,
  adminRole: 'owner' | 'staff',
  body: string
): Promise<MessageDTO> => {
  assertValidId(id);
  const Conversation = await getConversationModel();
  const Message      = await getMessageModel();

  const convo = await Conversation.findById(id);
  if (!convo) throw new AppError(ERRORS.NOT_FOUND, 404);

  const name = await resolveAdminName(adminId);
  const doc = await Message.create({
    conversation_id: convo._id,
    sender_type:     'admin',
    sender_id:       new mongoose.Types.ObjectId(adminId),
    sender_name:     name,
    sender_role:     adminRole,
    body,
  });

  convo.last_message_at      = doc.created_at;
  convo.last_message_preview = body.slice(0, 200);
  await convo.save();

  // The customer's view must never see the real admin name — build a separate,
  // correctly-masked DTO per audience instead of reusing one object for both.
  const userId = convo.user_id.toString();
  const adminDto = toMessageDTO(doc, { type: 'admin', id: adminId });
  const userDto  = toMessageDTO(doc, { type: 'user',  id: userId });
  sseManager.pushToUser(userId, 'chat_message', { conversation_id: convo._id.toString(), message: userDto });
  sseManager.pushToAllAdmins('chat_message', { conversation_id: convo._id.toString(), message: adminDto });

  notifyUserChatReply(userId, body).catch((err: any) =>
    logger.error('Customer chat-reply notification failed', { error: err?.message, stack: err?.stack })
  );

  return adminDto;
};

export const markSeenByAdmin = async (id: string): Promise<void> => {
  assertValidId(id);
  const Message = await getMessageModel();
  await Message.updateMany(
    { conversation_id: new mongoose.Types.ObjectId(id), sender_type: 'user', seen_at: null },
    { $set: { seen_at: new Date() } }
  );
};
