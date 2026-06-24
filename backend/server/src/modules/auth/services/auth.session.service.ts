import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { DeviceContext, detectDeviceType } from '../../../utils/request.utils';
import { getSessionModel } from '../../../models/session.model';
import { getUserModel } from '../../../models/user.model';
import {
  signUserAccessToken, signAdminAccessToken,
  signUserRefreshToken, signAdminRefreshToken,
  verifyUserRefreshToken, verifyAdminRefreshToken,
  hashToken,
  USER_REFRESH_MS, ADMIN_REFRESH_MS,
} from './auth.token.service';
import { AdminRole } from '../types/auth.types';

const logger = createLogger('auth-session');

const ERRORS = {
  INVALID_REFRESH: 'Invalid or expired refresh token',
  SESSION_EXPIRED: 'Session has expired. Please log in again.',
  REUSE_DETECTED:  'Suspicious activity detected. All sessions have been revoked for your security. Please log in again.',
} as const;

// ── Internal session builder ──────────────────────────────────────────────────

interface BuildOptions {
  userId:    string;
  email:     string;
  device:    DeviceContext;
  isAdmin:   boolean;
  adminRole?: AdminRole;
}

const buildSession = async ({ userId, email, device, isAdmin, adminRole }: BuildOptions) => {
  const Session   = await getSessionModel();
  const expiresAt = new Date(Date.now() + (isAdmin ? ADMIN_REFRESH_MS : USER_REFRESH_MS));

  // Single-session enforcement: revoke every prior active session for this user type
  await Session.updateMany(
    { user_id: userId, is_admin: isAdmin, revoked_at: null },
    { revoked_at: new Date() }
  );

  // Insert session first to obtain the _id — that id becomes part of the JWT,
  // which is then hashed and stored back. Two-step but avoids a separate UUID.
  const session = await Session.create({
    user_id:     userId,
    is_admin:    isAdmin,
    token_hash:  'pending',
    device_info: {
      ip:          device.ip_address,
      user_agent:  device.user_agent,
      device_type: detectDeviceType(device.user_agent),
    },
    expires_at: expiresAt,
  });

  const sessionId    = session._id.toString();
  const refreshToken = isAdmin
    ? signAdminRefreshToken(userId, sessionId)
    : signUserRefreshToken(userId, sessionId);

  await Session.findByIdAndUpdate(sessionId, { token_hash: hashToken(refreshToken) });

  const accessToken = isAdmin
    ? signAdminAccessToken(userId, email, adminRole!)
    : signUserAccessToken(userId, email);

  return { accessToken, refreshToken };
};

// ── Rotate helper — shared between user and admin refresh ─────────────────────

const rotateSession = async (
  rawToken: string,
  isAdmin: boolean,
  device: DeviceContext
) => {
  const verify = isAdmin ? verifyAdminRefreshToken : verifyUserRefreshToken;
  let payload;
  try { payload = verify(rawToken); }
  catch { throw new AppError(ERRORS.INVALID_REFRESH, 401); }

  const Session = await getSessionModel();
  const session = await Session.findById(payload.sessionId);

  if (!session || session.is_admin !== isAdmin) {
    throw new AppError(ERRORS.INVALID_REFRESH, 401);
  }

  if (session.expires_at < new Date()) throw new AppError(ERRORS.SESSION_EXPIRED, 401);
  if (session.token_hash !== hashToken(rawToken)) throw new AppError(ERRORS.INVALID_REFRESH, 401);

  // Atomically revoke the old session — if it was already revoked (concurrent request
  // or replayed token), treat it as theft and nuke every active session for this user.
  const claimed = await Session.findOneAndUpdate(
    { _id: payload.sessionId, revoked_at: null },
    { revoked_at: new Date() }
  );
  if (!claimed) {
    logger.warn('Refresh token reuse detected — revoking all sessions', { userId: payload.sub, isAdmin });
    await Session.updateMany(
      { user_id: session.user_id, is_admin: isAdmin, revoked_at: null },
      { revoked_at: new Date() }
    );
    throw new AppError(ERRORS.REUSE_DETECTED, 401);
  }

  // Fetch current user data so the new access token reflects any role changes
  const User = await getUserModel();
  const user = await User.findById(payload.sub).select('email admin_role').lean();

  return buildSession({
    userId:    payload.sub,
    email:     user?.email ?? '',
    device,
    isAdmin,
    adminRole: isAdmin ? ((user as any)?.admin_role ?? 'staff') : undefined,
  });
};

// ── Public API ────────────────────────────────────────────────────────────────

export const createUserSession = (userId: string, email: string, device: DeviceContext) =>
  buildSession({ userId, email, device, isAdmin: false });

export const createAdminSession = (userId: string, email: string, device: DeviceContext, adminRole: AdminRole) =>
  buildSession({ userId, email, device, isAdmin: true, adminRole });

export const refreshUserSession = (rawToken: string, device: DeviceContext) =>
  rotateSession(rawToken, false, device);

export const refreshAdminSession = (rawToken: string, device: DeviceContext) =>
  rotateSession(rawToken, true, device);

export const revokeSession = async (sessionId: string, userId: string, isAdmin: boolean): Promise<void> => {
  const Session = await getSessionModel();
  const result = await Session.findOneAndUpdate(
    { _id: sessionId, user_id: userId, is_admin: isAdmin, revoked_at: null },
    { revoked_at: new Date() }
  );
  if (!result) throw new AppError('Session not found', 404);
};

export const revokeAllUserSessions = async (userId: string): Promise<void> => {
  const Session = await getSessionModel();
  await Session.updateMany({ user_id: userId, is_admin: false, revoked_at: null }, { revoked_at: new Date() });
};

export const revokeAllAdminSessions = async (userId: string): Promise<void> => {
  const Session = await getSessionModel();
  await Session.updateMany({ user_id: userId, is_admin: true, revoked_at: null }, { revoked_at: new Date() });
};

export const getActiveSessions = async (userId: string, isAdmin: boolean) => {
  const Session = await getSessionModel();
  return Session.find({
    user_id:    userId,
    is_admin:   isAdmin,
    revoked_at: null,
    expires_at: { $gt: new Date() },
  }).sort({ created_at: -1 }).lean();
};
