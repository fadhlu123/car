import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { comparePassword } from '../../../utils/crypto.utils';
import { DeviceContext } from '../../../utils/request.utils';
import { getUserModel } from '../models/user.model';
import {
  createAdminSession,
  refreshAdminSession,
  revokeSession,
  revokeAllAdminSessions,
  getActiveSessions,
} from './auth.session.service';
import { logEvent } from './auth.audit.service';
import { AuthResult, AdminRole, UserSummary } from '../types/auth.types';
import { env } from '../../../configs/env.config';

const logger = createLogger('admin-auth');

const LOCKOUT_THRESHOLD  = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

const ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_INACTIVE:    'Admin account has been deactivated',
  ACCOUNT_LOCKED:      'Account temporarily locked. Try again in 15 minutes.',
  USER_NOT_FOUND:      'Admin account not found',
} as const;

const OWNER_EMAILS = (env.ADMIN_EMAILS ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

type Ctx = DeviceContext;

const toSummary = (user: any): UserSummary => ({
  id:             user._id.toString(),
  email:          user.email,
  role:           'admin',
  admin_role:     user.admin_role,
  first_name:     user.profile.first_name,
  last_name:      user.profile.last_name,
  avatar_url:     user.profile.avatar_url,
  email_verified: user.email_verified,
});

// ── Admin login ───────────────────────────────────────────────────────────────
// Two independent gates before a token is issued:
//  1. Email must be in ADMIN_EMAILS env var OR the user must already be role:'admin'
//     (covers staff admins added via invite — they're not in the env var).
//  2. Password must match the stored bcrypt hash.

export const adminLogin = async (email: string, password: string, ctx: Ctx): Promise<AuthResult> => {
  const normalised   = email.toLowerCase().trim();
  const isOwnerEmail = OWNER_EMAILS.includes(normalised);

  const User = await getUserModel();
  const user = await User.findOne({ email: normalised });

  // Reject if neither an owner email nor an existing admin account
  if (!user || (!isOwnerEmail && user.role !== 'admin')) {
    await logEvent({ email: normalised, event: 'admin_login_failed', success: false, ...ctx, metadata: { reason: 'not_authorised' }, persist: true });
    // Use the same message as wrong password — don't leak which check failed
    throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);
  }

  if (!user.password_hash) {
    await logEvent({ email: normalised, event: 'admin_login_failed', success: false, ...ctx, metadata: { reason: 'no_password' }, persist: true });
    throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);
  }

  if (!user.is_active) throw new AppError(ERRORS.ACCOUNT_INACTIVE, 403);
  if (user.locked_until && user.locked_until > new Date()) throw new AppError(ERRORS.ACCOUNT_LOCKED, 423);

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    const attempts = (user.failed_login_attempts ?? 0) + 1;
    const isLocked = attempts >= LOCKOUT_THRESHOLD;
    await User.findByIdAndUpdate(user._id, {
      failed_login_attempts: attempts,
      ...(isLocked ? { locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS) } : {}),
    });
    await logEvent({ userId: user._id.toString(), email: normalised, event: 'admin_login_failed', success: false, ...ctx, metadata: { attempts }, persist: true });
    if (isLocked) {
      await logEvent({ userId: user._id.toString(), email: normalised, event: 'account_locked', success: false, ...ctx, persist: true });
      logger.warn('Admin account locked', { userId: user._id });
    }
    throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);
  }

  // On first successful login for an owner-email: promote to admin + assign owner role.
  // For staff admins (added via invite), role/admin_role is already set.
  const adminRole: AdminRole = isOwnerEmail ? 'owner' : (user.admin_role ?? 'staff');
  if (user.role !== 'admin' || user.admin_role !== adminRole) {
    await User.findByIdAndUpdate(user._id, { role: 'admin', admin_role: adminRole });
  }

  await User.findByIdAndUpdate(user._id, { failed_login_attempts: 0, locked_until: null, last_login: new Date() });
  logger.info('Admin logged in', { userId: user._id, adminRole });

  const { accessToken, refreshToken } = await createAdminSession(user._id.toString(), user.email, ctx, adminRole);
  return {
    access_token:  accessToken,
    refresh_token: refreshToken,
    user: { ...toSummary(user), admin_role: adminRole },
  };
};

// ── Logout ────────────────────────────────────────────────────────────────────

export const adminLogout = async (sessionId: string, adminId: string, ctx: Ctx): Promise<void> => {
  await revokeSession(sessionId, adminId, true);
  logger.info('Admin logged out', { userId: adminId });
};

// ── Refresh ───────────────────────────────────────────────────────────────────

export const adminRefresh = async (
  rawRefreshToken: string,
  ctx: Ctx
): Promise<{ access_token: string; refresh_token: string }> => {
  const { accessToken, refreshToken } = await refreshAdminSession(rawRefreshToken, ctx);
  return { access_token: accessToken, refresh_token: refreshToken };
};

// ── Profile + sessions ────────────────────────────────────────────────────────

export const getAdminProfile = async (adminId: string): Promise<UserSummary> => {
  const User = await getUserModel();
  const user = await User.findById(adminId).lean();
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);
  return toSummary(user);
};

export const listAdminSessions = (adminId: string) =>
  getActiveSessions(adminId, true);
