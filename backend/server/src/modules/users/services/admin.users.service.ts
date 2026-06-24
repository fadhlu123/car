import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { DeviceContext } from '../../../utils/request.utils';
import { getUserModel } from '../../../models/user.model';
import { getAuditModel } from '../../../models/audit.model';
import { logEvent } from '../../auth/services/auth.audit.service';
import { revokeAllUserSessions, revokeAllAdminSessions } from '../../auth/services/auth.session.service';
import {
  notifyAccountUnlocked,
  notifyAccountDeactivated,
  notifyAccountActivated,
} from '../../auth/services/auth.notify.service';

const logger = createLogger('admin-users');

const ERRORS = {
  USER_NOT_FOUND:     'User not found',
  CANNOT_SELF_MODIFY: 'You cannot modify your own account status',
  OWNER_PROTECTED:    'Owner accounts can only be modified by another owner',
} as const;

type Ctx = DeviceContext;

// ── List users ────────────────────────────────────────────────────────────────

export interface UserListQuery {
  page?:   number;
  limit?:  number;
  search?: string;
  role?:   string;
  active?: boolean;
}

export const listUsers = async (query: UserListQuery) => {
  const User  = await getUserModel();
  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(100, query.limit ?? 20);
  const skip  = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.role)              filter.role      = query.role;
  if (query.active !== undefined) filter.is_active = query.active;
  if (query.search) {
    const re = new RegExp(query.search, 'i');
    filter.$or = [
      { email: re },
      { 'profile.first_name': re },
      { 'profile.last_name':  re },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('email role admin_role profile is_active email_verified failed_login_attempts locked_until last_login created_at')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return { users, total, page, limit, pages: Math.ceil(total / limit) };
};

// ── Single user detail ────────────────────────────────────────────────────────

export const getUserDetail = async (userId: string) => {
  const User  = await getUserModel();
  const Audit = await getAuditModel();

  const [user, recent_activity] = await Promise.all([
    User.findById(userId)
      .select('-password_hash -providers')
      .lean(),
    Audit.find({ user_id: userId })
      .sort({ created_at: -1 })
      .limit(20)
      .lean(),
  ]);

  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);
  return { user, recent_activity };
};

// ── Account lockout management ────────────────────────────────────────────────

export const unlockAccount = async (
  targetId: string,
  adminId:  string,
  adminRole: 'owner' | 'staff',
  ctx: Ctx
): Promise<void> => {
  if (targetId === adminId) throw new AppError(ERRORS.CANNOT_SELF_MODIFY, 422);

  const User   = await getUserModel();
  const target = await User.findById(targetId);
  if (!target) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  // Staff admin cannot unlock another admin
  if (target.role === 'admin' && adminRole !== 'owner') {
    throw new AppError(ERRORS.OWNER_PROTECTED, 403);
  }

  await User.findByIdAndUpdate(targetId, { failed_login_attempts: 0, locked_until: null });
  await logEvent({ userId: targetId, email: target.email, event: 'account_unlocked', success: true, ...ctx, metadata: { by: adminId } });
  logger.info('Account unlocked', { targetId, by: adminId });

  try {
    await notifyAccountUnlocked(targetId, target.email, target.profile.first_name);
  } catch (err: any) {
    logger.error('Account unlocked notification failed', { error: err?.message });
  }
};

// ── Deactivate / activate ─────────────────────────────────────────────────────

export const deactivateAccount = async (
  targetId:  string,
  adminId:   string,
  adminRole: 'owner' | 'staff',
  ctx: Ctx
): Promise<void> => {
  if (targetId === adminId) throw new AppError(ERRORS.CANNOT_SELF_MODIFY, 422);

  const User   = await getUserModel();
  const target = await User.findById(targetId);
  if (!target) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  if (target.role === 'admin' && adminRole !== 'owner') {
    throw new AppError(ERRORS.OWNER_PROTECTED, 403);
  }

  await User.findByIdAndUpdate(targetId, { is_active: false });

  // Immediately revoke all active sessions so the block takes effect
  await Promise.all([
    revokeAllUserSessions(targetId),
    revokeAllAdminSessions(targetId),
  ]);

  await logEvent({ userId: targetId, email: target.email, event: 'account_deactivated', success: true, ...ctx, metadata: { by: adminId } });
  logger.info('Account deactivated', { targetId, by: adminId });

  try {
    await notifyAccountDeactivated(targetId, target.email);
  } catch (err: any) {
    logger.error('Account deactivated notification failed', { error: err?.message });
  }
};

export const activateAccount = async (
  targetId:  string,
  adminId:   string,
  adminRole: 'owner' | 'staff',
  ctx: Ctx
): Promise<void> => {
  if (targetId === adminId) throw new AppError(ERRORS.CANNOT_SELF_MODIFY, 422);

  const User   = await getUserModel();
  const target = await User.findById(targetId);
  if (!target) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  if (target.role === 'admin' && adminRole !== 'owner') {
    throw new AppError(ERRORS.OWNER_PROTECTED, 403);
  }

  await User.findByIdAndUpdate(targetId, { is_active: true });
  await logEvent({ userId: targetId, email: target.email, event: 'account_activated', success: true, ...ctx, metadata: { by: adminId } });
  logger.info('Account activated', { targetId, by: adminId });

  try {
    await notifyAccountActivated(targetId, target.email);
  } catch (err: any) {
    logger.error('Account activated notification failed', { error: err?.message });
  }
};
