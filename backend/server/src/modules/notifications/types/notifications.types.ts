// ─── In-app notification types ───────────────────────────────────────────────

export type UserNotificationType =
  | 'welcome'
  | 'email_verified'
  | 'account_locked'
  | 'account_unlocked'
  | 'account_deactivated'
  | 'account_activated'
  | 'password_changed'
  | 'order_received'
  | 'order_update'
  | 'chat_reply'
  | 'broadcast';

export type AdminNotificationType =
  | 'new_order'
  | 'new_user'
  | 'product_sold'
  | 'invite_accepted'
  | 'team_member_removed'
  | 'new_chat_message';

export type NotificationType = UserNotificationType | AdminNotificationType;

// ─── Response shapes ──────────────────────────────────────────────────────────

export interface InAppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
  cta_url?: string;
  is_read: boolean;
  created_at: Date;
}

export interface BroadcastPayload {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  cta_url?: string;
  cta_label?: string;
  audience: 'all_users' | 'verified_only';
  is_active: boolean;
  published_by: string;
  created_at: Date;
}

export interface NotificationFeed {
  notifications: InAppNotification[];
  unread_count: number;
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ─── Internal: order snapshot (avoids cross-module type coupling) ─────────────

export interface OrderSnapshot {
  id: string;
  customer: { name: string; email: string; phone: string };
  total_amount: number;
  currency: string;
  status: string;
  items: Array<{ product_id: string; name: string; quantity: number; price: number }>;
}

// ─── Dispatcher event union ───────────────────────────────────────────────────
// Every service that needs to notify calls dispatch() with one of these payloads.

export type DispatchEvent =
  | { type: 'email_verification';  userId?: string; email: string; firstName: string; otp: string }
  | { type: 'password_reset';      userId?: string; email: string; firstName: string; otp: string }
  | { type: 'new_device_login';    userId?: string; email: string; firstName: string; ip: string; device: string; time: string }
  | { type: 'welcome';             userId: string;  email: string; firstName: string }
  | { type: 'account_locked';      userId: string;  email: string; firstName: string }
  | { type: 'account_unlocked';    userId: string;  email: string; firstName?: string }
  | { type: 'account_deactivated'; userId: string;  email: string }
  | { type: 'account_activated';   userId: string;  email: string }
  | { type: 'password_changed';    userId: string;  email: string; firstName: string }
  | { type: 'admin_invite';        email: string;   inviterName: string; inviteUrl: string }
  | { type: 'invite_accepted';     adminId: string; newMemberName: string; newMemberEmail: string }
  | { type: 'team_member_removed'; adminId: string; removedName: string }
  | { type: 'order_received';      userId?: string; order: OrderSnapshot }
  | { type: 'new_order_admin';     order: OrderSnapshot }
  | { type: 'order_status_update'; userId?: string; order: OrderSnapshot; previousStatus: string }
  | { type: 'new_chat_message_admin'; customerName: string; preview: string }
  | { type: 'chat_reply_user';        userId: string; preview: string };
