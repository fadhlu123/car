import mongoose from 'mongoose';
import { createLogger } from '../../../utils/logger.utils';
import { env } from '../../../configs/env.config';
import { renderTemplate } from '../email/email.engine';
import { sendEmail } from '../email/email.sender';
import { sseManager } from '../sse/sse.manager';
import { getNotificationModel } from '../models/notification.model';
import { sendPushToUser, sendPushToAllAdmins } from './push.service';
import { DispatchEvent, InAppNotification } from '../types/notifications.types';

const logger = createLogger('notification-dispatcher');

// ─── Helpers ──────────────────────────────────────────────────────────────────

const saveInApp = async (
  recipientId:   string | null,
  recipientType: 'user' | 'admin',
  type:          string,
  title:         string,
  body:          string,
  metadata?:     Record<string, unknown>,
  ctaUrl?:       string
): Promise<InAppNotification | null> => {
  try {
    const Notification = await getNotificationModel();
    const doc = await Notification.create({
      recipient_id:   recipientId ? new mongoose.Types.ObjectId(recipientId) : undefined,
      recipient_type: recipientType,
      type,
      title,
      body,
      metadata,
      cta_url: ctaUrl,
    });
    return {
      id:         doc._id.toString(),
      type:       doc.type as any,
      title:      doc.title,
      body:       doc.body,
      metadata:   doc.metadata,
      cta_url:    doc.cta_url,
      is_read:    doc.is_read,
      created_at: doc.created_at,
    };
  } catch (err: any) {
    logger.warn('Failed to persist in-app notification', { error: err.message });
    return null;
  }
};

const email = async (
  to:       string,
  subject:  string,
  template: string,
  ctx:      Record<string, unknown>
): Promise<void> => {
  try {
    const clientUrl = env.CLIENT_URL;
    const html = await renderTemplate(template, { ...ctx, clientUrl });
    await sendEmail({ to, subject, html });
  } catch (err: any) {
    logger.warn('Failed to send email', { to, template, error: err.message });
  }
};

const shortId = (id: string) => id.slice(-8).toUpperCase();

const push = async (
  target: 'user' | 'all_admins',
  userId: string | null,
  payload: Parameters<typeof sendPushToUser>[1]
): Promise<void> => {
  try {
    if (target === 'user' && userId) {
      await sendPushToUser(userId, payload);
    } else if (target === 'all_admins') {
      await sendPushToAllAdmins(payload);
    }
  } catch (err: any) {
    logger.warn('Push notification failed', { error: err.message });
  }
};

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export const dispatch = async (event: DispatchEvent): Promise<void> => {
  logger.debug('dispatch', { type: event.type });

  switch (event.type) {

    // ── Email verification ───────────────────────────────────────────────────
    case 'email_verification': {
      // Email only — OTP must not appear in the in-app feed where it could be read by a session attacker
      await email(event.email, 'Verify your email address', 'verify-email', {
        firstName: event.firstName, otp: event.otp, expiryMinutes: 10,
      });
      break;
    }

    // ── Password reset ───────────────────────────────────────────────────────
    case 'password_reset': {
      await email(event.email, 'Reset your password', 'password-reset', {
        firstName: event.firstName, otp: event.otp, expiryMinutes: 10,
      });
      // No in-app — user may be locked out and can't see the app; email is the only channel
      break;
    }

    // ── New device login alert ───────────────────────────────────────────────
    case 'new_device_login': {
      await email(event.email, 'New sign-in to your account', 'new-device-login', {
        firstName: event.firstName, ip: event.ip, device: event.device, time: event.time,
      });
      if (event.userId) {
        const n = await saveInApp(event.userId, 'user', 'account_locked',
          'New sign-in detected',
          `A sign-in from ${event.device} (${event.ip}) was recorded at ${event.time}.`);
        if (n) sseManager.pushToUser(event.userId, 'notification', n);
      }
      break;
    }

    // ── Welcome ──────────────────────────────────────────────────────────────
    case 'welcome': {
      await email(event.email, `Welcome to ${env.SERVICE_NAME}!`, 'welcome', {
        firstName: event.firstName,
      });
      const n = await saveInApp(event.userId, 'user', 'welcome',
        `Welcome, ${event.firstName}!`,
        'Your account is ready. Start exploring our inventory of premium vehicles.');
      if (n) sseManager.pushToUser(event.userId, 'notification', n);
      await push('user', event.userId, {
        title: `Welcome to ${env.SERVICE_NAME}!`,
        body:  'Your account is ready. Explore our inventory.',
        url:   env.CLIENT_URL,
      });
      break;
    }

    // ── Account locked ───────────────────────────────────────────────────────
    case 'account_locked': {
      // Email only — user is locked out and cannot reach the in-app feed anyway
      await email(event.email, 'Account temporarily locked', 'account-alert', {
        firstName: event.firstName, alertType: 'locked',
        message: 'Your account has been temporarily locked due to multiple failed login attempts. It will unlock automatically in 15 minutes.',
      });
      break;
    }

    // ── Account unlocked (by admin) ──────────────────────────────────────────
    case 'account_unlocked': {
      // Email only — user was locked out; email is the only reliable channel to reach them
      await email(event.email, 'Your account has been unlocked', 'account-alert', {
        firstName: event.firstName ?? 'there', alertType: 'unlocked',
        message: 'Your account lockout has been cleared by an administrator. You can now sign in again.',
      });
      break;
    }

    // ── Account deactivated ──────────────────────────────────────────────────
    case 'account_deactivated': {
      const n = await saveInApp(event.userId, 'user', 'account_deactivated',
        'Account deactivated',
        'Your account has been deactivated by an administrator. Contact support for assistance.');
      if (n) sseManager.pushToUser(event.userId, 'notification', n);
      break;
    }

    // ── Account activated ────────────────────────────────────────────────────
    case 'account_activated': {
      const n = await saveInApp(event.userId, 'user', 'account_activated',
        'Account reactivated',
        'Your account has been reactivated. Welcome back!');
      if (n) sseManager.pushToUser(event.userId, 'notification', n);
      break;
    }

    // ── Password changed ─────────────────────────────────────────────────────
    case 'password_changed': {
      // Email only — security event; must reach the user even if an attacker has their session
      await email(event.email, 'Your password was changed', 'account-alert', {
        firstName: event.firstName, alertType: 'password',
        message: 'Your account password was successfully changed. If this was not you, contact support immediately.',
      });
      break;
    }

    // ── Admin invite ─────────────────────────────────────────────────────────
    case 'admin_invite': {
      await email(event.email, `You have been invited to join ${env.SERVICE_NAME}`, 'admin-invite', {
        inviterName: event.inviterName, inviteUrl: event.inviteUrl, expiryDays: 7,
      });
      break;
    }

    // ── Invite accepted ──────────────────────────────────────────────────────
    case 'invite_accepted': {
      const n = await saveInApp(event.adminId, 'admin', 'invite_accepted',
        'New team member joined',
        `${event.newMemberName} (${event.newMemberEmail}) accepted their invitation and joined the team.`);
      if (n) sseManager.pushToAdmin(event.adminId, 'notification', n);
      break;
    }

    // ── Team member removed ──────────────────────────────────────────────────
    case 'team_member_removed': {
      const n = await saveInApp(event.adminId, 'admin', 'team_member_removed',
        'Team member removed',
        `${event.removedName} has been removed from the admin team.`);
      if (n) sseManager.pushToAdmin(event.adminId, 'notification', n);
      break;
    }

    // ── Order received (customer + in-app if logged in) ──────────────────────
    case 'order_received': {
      const { order } = event;
      await email(order.customer.email, 'We have received your order!', 'order-confirmation', {
        customer: order.customer,
        shortId:  shortId(order.id),
        items:    order.items,
        total:    order.total_amount,
        currency: order.currency,
      });
      if (event.userId) {
        const n = await saveInApp(event.userId, 'user', 'order_received',
          'Order received',
          `Your order #${shortId(order.id)} is confirmed. Our team will contact you shortly.`,
          { order_id: order.id });
        if (n) sseManager.pushToUser(event.userId, 'notification', n);
      }
      break;
    }

    // ── New order admin alert ────────────────────────────────────────────────
    case 'new_order_admin': {
      const { order } = event;
      const adminOrderUrl = `${env.CLIENT_URL}/admin/orders/${order.id}`;
      await email(
        env.EMAIL_FROM ?? 'admin@example.com',
        `New order from ${order.customer.name}`,
        'new-order-admin',
        {
          customer:    order.customer,
          shortId:     shortId(order.id),
          items:       order.items,
          itemCount:   order.items.length,
          total:       order.total_amount,
          currency:    order.currency,
          adminOrderUrl,
        }
      );
      // Shared admin in-app notification — no recipient_id means "all admins"
      const n = await saveInApp(null, 'admin', 'new_order',
        'New order received',
        `${order.customer.name} placed an order — ${order.currency} ${order.total_amount}`,
        { order_id: order.id });
      // Push to all connected admins in real time (SSE) + background push
      if (n) sseManager.pushToAllAdmins('new_order', n);
      await push('all_admins', null, {
        title: 'New order received',
        body:  `${order.customer.name} — ${order.currency} ${order.total_amount}`,
        url:   `${env.CLIENT_URL}/admin/orders/${order.id}`,
        tag:   `order-${order.id}`,
      });
      break;
    }

    // ── Order status update ──────────────────────────────────────────────────
    case 'order_status_update': {
      const { order, previousStatus } = event;
      await email(
        order.customer.email,
        `Update on your order #${shortId(order.id)}`,
        'order-status-update',
        {
          customer:       order.customer,
          shortId:        shortId(order.id),
          previousStatus,
          newStatus:      order.status,
        }
      );
      if (event.userId) {
        const n = await saveInApp(event.userId, 'user', 'order_update',
          'Order status updated',
          `Order #${shortId(order.id)} moved from ${previousStatus} → ${order.status}.`,
          { order_id: order.id });
        if (n) sseManager.pushToUser(event.userId, 'notification', n);
        await push('user', event.userId, {
          title: 'Order update',
          body:  `Your order #${shortId(order.id)} is now ${order.status}.`,
          url:   `${env.CLIENT_URL}/orders/${order.id}`,
          tag:   `order-update-${order.id}`,
        });
      }
      break;
    }

    default: {
      logger.warn('Unknown dispatch event', { event: (event as any).type });
    }
  }
};
