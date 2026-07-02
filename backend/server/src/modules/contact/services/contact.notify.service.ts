import { dispatch } from '../../notifications/services/notification.dispatcher';

const PREVIEW_LENGTH = 120;
const preview = (body: string): string =>
  body.length > PREVIEW_LENGTH ? `${body.slice(0, PREVIEW_LENGTH)}…` : body;

export const notifyAdminNewChatMessage = (customerName: string, body: string): Promise<void> =>
  dispatch({ type: 'new_chat_message_admin', customerName, preview: preview(body) });

export const notifyUserChatReply = (userId: string, body: string): Promise<void> =>
  dispatch({ type: 'chat_reply_user', userId, preview: preview(body) });
