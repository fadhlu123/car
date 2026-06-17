import { AppError } from '../../../utils/error.utils';
import { createLogger } from '../../../utils/logger.utils';
import { hashPassword, comparePassword } from '../../../utils/crypto.utils';
import { DeviceContext } from '../../../utils/request.utils';
import { getUserModel } from '../models/user.model';
import { generateAndStoreOtp, verifyOtp, invalidateOtps } from './auth.otp.service';
import { logEvent } from './auth.audit.service';
import { sendPasswordResetEmail } from './auth.notify.service';
import { revokeAllUserSessions } from './auth.session.service';

const logger = createLogger('auth-password');

const ERRORS = {
  USER_NOT_FOUND:   'No account found with this email address',
  WRONG_PASSWORD:   'Current password is incorrect',
  SAME_PASSWORD:    'New password must differ from the current password',
  ACCOUNT_INACTIVE: 'Account is deactivated',
} as const;

type RequestContext = DeviceContext;

export const requestPasswordReset = async (
  email: string,
  ctx: RequestContext
): Promise<void> => {
  const User  = await getUserModel();
  const user  = await User.findOne({ email: email.toLowerCase().trim() });

  // Always respond the same way — don't leak whether email exists
  if (!user) {
    logger.warn('Password reset requested for unknown email', { email });
    return;
  }

  const otp = await generateAndStoreOtp(user._id.toString(), 'password_reset');
  await sendPasswordResetEmail(user.email, otp, user.profile.first_name);

  await logEvent({
    userId: user._id.toString(), email: user.email,
    event: 'password_reset_requested', success: true, ...ctx,
  });
};

export const resetPassword = async (
  email: string,
  otpCode: string,
  newPassword: string,
  ctx: RequestContext
): Promise<void> => {
  const User = await getUserModel();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw new AppError(ERRORS.USER_NOT_FOUND, 404);

  await verifyOtp(user._id.toString(), 'password_reset', otpCode);

  const password_hash = await hashPassword(newPassword);
  await User.findByIdAndUpdate(user._id, { password_hash, failed_login_attempts: 0, locked_until: null });

  // Invalidate all sessions — user must log in fresh after password reset
  await revokeAllUserSessions(user._id.toString());
  await invalidateOtps(user._id.toString(), 'password_reset');

  await logEvent({
    userId: user._id.toString(), email: user.email,
    event: 'password_reset_completed', success: true, ...ctx,
  });

  logger.info('Password reset completed', { userId: user._id });
};

export const changePassword = async (
  userId: string,
  email: string,
  currentPassword: string,
  newPassword: string,
  ctx: RequestContext
): Promise<void> => {
  const User = await getUserModel();
  const user = await User.findById(userId);
  if (!user)          throw new AppError(ERRORS.USER_NOT_FOUND, 404);
  if (!user.is_active) throw new AppError(ERRORS.ACCOUNT_INACTIVE, 403);

  if (!user.password_hash) {
    // OAuth-only account — set password for the first time
    const password_hash = await hashPassword(newPassword);
    await User.findByIdAndUpdate(userId, { password_hash, $addToSet: { providers: { provider: 'local', provider_id: user.email } } });
  } else {
    if (!(await comparePassword(currentPassword, user.password_hash))) {
      throw new AppError(ERRORS.WRONG_PASSWORD, 401);
    }
    if (await comparePassword(newPassword, user.password_hash)) {
      throw new AppError(ERRORS.SAME_PASSWORD, 422);
    }
    await User.findByIdAndUpdate(userId, { password_hash: await hashPassword(newPassword) });
  }

  // Revoke all sessions except current — caller will handle re-issuing if needed
  await revokeAllUserSessions(userId);

  await logEvent({
    userId, email,
    event: 'password_changed', success: true, ...ctx,
  });

  logger.info('Password changed', { userId });
};
