import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { hashPassword, comparePassword } from '../../../utils/crypto.utils';
import { DeviceContext } from '../../../utils/request.utils';
import { getUserModel } from '../models/user.model';
import {
  createUserSession,
  refreshUserSession,
  revokeSession,
  revokeAllUserSessions,
  getActiveSessions,
} from './auth.session.service';
import { verifyGoogleToken } from './auth.google.service';
import { generateAndStoreOtp, verifyOtp } from './auth.otp.service';
import { logEvent } from './auth.audit.service';
import { sendEmailVerificationEmail } from './auth.notify.service';
import { AuthResult, OAuthProfile, UserSummary } from '../types/auth.types';

const logger = createLogger('user-auth');

const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

const ERRORS = {
  EMAIL_IN_USE:        'An account with this email already exists',
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_INACTIVE:    'Your account has been deactivated. Contact support.',
  ACCOUNT_LOCKED:      'Account temporarily locked due to too many failed attempts. Try again in 15 minutes.',
  GOOGLE_FAILED:       'Google authentication failed',
  USER_NOT_FOUND:      'User not found',
  ALREADY_LINKED:      'Google is already linked to this account',
  NO_PASSWORD:         'Set a password first before linking Google',
} as const;

type Ctx = DeviceContext;

// ── Helpers ──────────────────────────────────────────────────────────────────

const toSummary = (user: any): UserSummary => ({
  id:             user._id.toString(),
  email:          user.email,
  role:           user.role,
  first_name:     user.profile.first_name,
  last_name:      user.profile.last_name,
  avatar_url:     user.profile.avatar_url,
  email_verified: user.email_verified,
});

const checkLockout = (user: any): void => {
  if (user.locked_until && user.locked_until > new Date()) {
    throw new AppError(ERRORS.ACCOUNT_LOCKED, 423);
  }
};

const handleFailedLogin = async (user: any): Promise<void> => {
  const User    = await getUserModel();
  const attempts = (user.failed_login_attempts ?? 0) + 1;
  const isLocked = attempts >= LOCKOUT_THRESHOLD;

  await User.findByIdAndUpdate(user._id, {
    failed_login_attempts: attempts,
    ...(isLocked ? { locked_until: new Date(Date.now() + LOCKOUT_DURATION_MS) } : {}),
  });

  if (isLocked) {
    logger.warn('Account locked after repeated failures', { userId: user._id });
  }
};

// ── Register ─────────────────────────────────────────────────────────────────

export const register = async (
  email: string,
  password: string,
  first_name: string,
  last_name: string,
  ctx: Ctx
): Promise<AuthResult> => {
  const User       = await getUserModel();
  const normalised = email.toLowerCase().trim();

  if (await User.findOne({ email: normalised })) {
    throw new AppError(ERRORS.EMAIL_IN_USE, 409);
  }

  const password_hash = await hashPassword(password);
  const user = await User.create({
    email: normalised,
    password_hash,
    // role is always 'user' on register — admin access comes via adminLogin only
    role:      'user',
    providers: [{ provider: 'local', provider_id: normalised }],
    profile:   { first_name, last_name, avatar_url: '' },
  });

  const otp = await generateAndStoreOtp(user._id.toString(), 'email_verification');
  try {
    await sendEmailVerificationEmail(user.email, otp, first_name, user._id.toString());
  } catch (err: any) {
    logger.error('Verification email failed on register', { error: err?.message });
  }

  await logEvent({ userId: user._id.toString(), email: normalised, event: 'register', success: true, ...ctx, persist: false });
  logger.info('User registered', { userId: user._id });

  const { accessToken, refreshToken } = await createUserSession(user._id.toString(), user.email, ctx);
  return { access_token: accessToken, refresh_token: refreshToken, user: toSummary(user) };
};

// ── Login ─────────────────────────────────────────────────────────────────────

export const login = async (
  email: string,
  password: string,
  ctx: Ctx
): Promise<AuthResult> => {
  const User = await getUserModel();
  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || !user.password_hash) {
    await logEvent({ email, event: 'login_failed', success: false, ...ctx, metadata: { reason: 'user_not_found' }, persist: true });
    throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);
  }

  checkLockout(user);

  if (!user.is_active) throw new AppError(ERRORS.ACCOUNT_INACTIVE, 403);

  const valid = await comparePassword(password, user.password_hash);
  if (!valid) {
    await handleFailedLogin(user);
    await logEvent({ userId: user._id.toString(), email: user.email, event: 'login_failed', success: false, ...ctx, metadata: { reason: 'bad_password' }, persist: true });
    if ((user.failed_login_attempts + 1) >= LOCKOUT_THRESHOLD) {
      await logEvent({ userId: user._id.toString(), email: user.email, event: 'account_locked', success: false, ...ctx, persist: true });
    }
    throw new AppError(ERRORS.INVALID_CREDENTIALS, 401);
  }

  // Successful login — reset lockout
  await User.findByIdAndUpdate(user._id, { failed_login_attempts: 0, locked_until: null, last_login: new Date() });
  await logEvent({ userId: user._id.toString(), email: user.email, event: 'login_success', success: true, ...ctx, persist: false });
  logger.info('User logged in', { userId: user._id });

  const { accessToken, refreshToken } = await createUserSession(user._id.toString(), user.email, ctx);
  return { access_token: accessToken, refresh_token: refreshToken, user: toSummary(user) };
};

// ── Logout ────────────────────────────────────────────────────────────────────

export const logout = async (sessionId: string, userId: string, ctx: Ctx): Promise<void> => {
  await revokeSession(sessionId, userId, false);
  logger.info('User logged out', { userId });
};

export const logoutAll = async (userId: string, ctx: Ctx): Promise<void> => {
  await revokeAllUserSessions(userId);
  logger.info('User logged out all sessions', { userId });
};

// ── Refresh ───────────────────────────────────────────────────────────────────

export const refresh = async (
  rawRefreshToken: string,
  ctx: Ctx
): Promise<{ access_token: string; refresh_token: string }> => {
  const result = await refreshUserSession(rawRefreshToken, ctx);
  return { access_token: result.accessToken, refresh_token: result.refreshToken };
};

// ── Profile + sessions ────────────────────────────────────────────────────────

export const getProfile = async (userId: string): Promise<UserSummary> => {
  const User = await getUserModel();
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);
  return toSummary(user);
};

export const listSessions = async (userId: string) =>
  getActiveSessions(userId, false);

export const deleteSession = async (sessionId: string, userId: string, ctx: Ctx): Promise<void> =>
  logout(sessionId, userId, ctx);

// ── Email verification ────────────────────────────────────────────────────────

export const verifyEmail = async (userId: string, otpCode: string): Promise<void> => {
  await verifyOtp(userId, 'email_verification', otpCode);
  const User = await getUserModel();
  await User.findByIdAndUpdate(userId, { email_verified: true });
};

export const resendVerification = async (userId: string): Promise<void> => {
  const User = await getUserModel();
  const user = await User.findById(userId);
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);
  const otp = await generateAndStoreOtp(userId, 'email_verification');
  await sendEmailVerificationEmail(user.email, otp, user.profile.first_name);
};

// ── Google OAuth ──────────────────────────────────────────────────────────────

const handleOAuthProfile = async (profile: OAuthProfile, ctx: Ctx): Promise<AuthResult> => {
  const User = await getUserModel();
  let user = await User.findOne({ email: profile.email.toLowerCase() });

  if (user) {
    const linked = user.providers.some((p) => p.provider === profile.provider);
    if (!linked) {
      user.providers.push({ provider: profile.provider, provider_id: profile.provider_id });
      await user.save();
      logger.info('Google provider linked to existing account', { userId: user._id });
    }
  } else {
    user = await User.create({
      email:     profile.email.toLowerCase(),
      role:      'user',
      providers: [{ provider: profile.provider, provider_id: profile.provider_id }],
      profile:   { first_name: profile.first_name, last_name: profile.last_name, avatar_url: profile.avatar_url },
      email_verified: true,  // Google verifies email ownership
    });
    logger.info('OAuth user created', { userId: user._id, provider: profile.provider });
  }

  if (!user.is_active) throw new AppError(ERRORS.ACCOUNT_INACTIVE, 403);
  await User.findByIdAndUpdate(user._id, { last_login: new Date() });
  logger.info('OAuth login success', { userId: user._id, provider: profile.provider });

  const { accessToken, refreshToken } = await createUserSession(user._id.toString(), user.email, ctx);
  return { access_token: accessToken, refresh_token: refreshToken, user: toSummary(user) };
};

export const googleAuth = async (idToken: string, ctx: Ctx): Promise<AuthResult> => {
  try {
    const profile = await verifyGoogleToken(idToken);
    return handleOAuthProfile(profile, ctx);
  } catch (err: any) {
    if (err instanceof AppError) throw err;
    throw new AppError(ERRORS.GOOGLE_FAILED, 401);
  }
};

// ── Link Google to existing account ──────────────────────────────────────────

export const linkGoogle = async (userId: string, idToken: string, ctx: Ctx): Promise<void> => {
  const User    = await getUserModel();
  const user    = await User.findById(userId);
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  const already = user.providers.some((p) => p.provider === 'google');
  if (already) throw new AppError(ERRORS.ALREADY_LINKED, 409);

  const profile = await verifyGoogleToken(idToken);
  if (profile.email.toLowerCase() !== user.email) {
    throw new AppError('Google account email does not match your account email', 422);
  }

  user.providers.push({ provider: 'google', provider_id: profile.provider_id });
  if (!user.profile.avatar_url && profile.avatar_url) user.profile.avatar_url = profile.avatar_url;
  await user.save();

  logger.info('Google account linked', { userId });
};

// ── Password management (delegated to auth.password.service) ─────────────────
export {
  requestPasswordReset as forgotPasswordRequest,
  resetPassword,
  changePassword,
} from './auth.password.service';
