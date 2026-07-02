import { IMessage } from '../../../models/message.model';
import { IConversation } from '../../../models/conversation.model';
import { MessageDTO, ConversationDTO } from '../contact.types';

export const EDIT_WINDOW_MS = 15 * 60 * 1000;

type Viewer = { type: 'user' | 'admin'; id: string };

// Customers never see which specific admin/staff member they're talking to —
// only a role tag. Admins reviewing a thread (their own or a colleague's)
// always see the real name; only the customer-facing view is masked.
const displaySenderName = (doc: IMessage, viewer: Viewer): string => {
  if (doc.sender_type === 'admin' && viewer.type === 'user') {
    return doc.sender_role === 'owner' ? 'Owner' : 'Staff';
  }
  return doc.sender_name;
};

export const toMessageDTO = (doc: IMessage, viewer: Viewer): MessageDTO => {
  const isOwn = doc.sender_type === viewer.type && doc.sender_id.toString() === viewer.id;
  const withinWindow = Date.now() - doc.created_at.getTime() < EDIT_WINDOW_MS;
  return {
    id:          doc._id.toString(),
    sender_type: doc.sender_type,
    sender_name: displaySenderName(doc, viewer),
    body:        doc.body,
    edited_at:   doc.edited_at ?? null,
    seen_at:     doc.seen_at ?? null,
    created_at:  doc.created_at,
    editable:    isOwn && withinWindow,
  };
};

export const toConversationDTO = (
  doc: IConversation,
  messages: IMessage[],
  viewer: Viewer
): ConversationDTO => ({
  id:                    doc._id.toString(),
  last_message_at:       doc.last_message_at ?? null,
  last_message_preview:  doc.last_message_preview ?? null,
  created_at:            doc.created_at,
  messages:              messages.map((m) => toMessageDTO(m, viewer)),
});
