export interface MessageDTO {
  id:           string;
  sender_type:  'user' | 'admin';
  sender_name:  string;
  body:         string;
  edited_at:    Date | null;
  seen_at:      Date | null;
  created_at:   Date;
  editable:     boolean; // computed server-side from EDIT_WINDOW_MS, own messages only
}

export interface ConversationDTO {
  id:                    string;
  last_message_at:       Date | null;
  last_message_preview:  string | null;
  created_at:            Date;
  messages:              MessageDTO[];
}

export interface ConversationSummaryDTO {
  id:                    string;
  user:                  { id: string; name: string; email: string };
  last_message_at:       Date | null;
  last_message_preview:  string | null;
  unread:                boolean;
}

export interface AdminListConversationsQuery {
  page?:  number;
  limit?: number;
}
