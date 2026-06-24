import crypto from 'crypto';
import { AppError } from '../../../utils/error.utils';
import { getOtpModel } from '../../../models/otp.model';
import { OtpType } from '../types/auth.types';

const OTP_EXPIRY_MS  = 10 * 60 * 1000;  // 10 minutes
const MAX_ATTEMPTS   = 3;

const ERRORS = {
  INVALID_OR_EXPIRED: 'Invalid or expired OTP. Please request a new one.',
  TOO_MANY_ATTEMPTS:  'Too many failed attempts. Please request a new OTP.',
  ALREADY_USED:       'This OTP has already been used.',
} as const;

const hashCode = (code: string): string =>
  crypto.createHash('sha256').update(code).digest('hex');

const generateCode = (): string =>
  String(crypto.randomInt(100000, 999999));  // cryptographically random 6-digit

export const generateAndStoreOtp = async (userId: string, type: OtpType): Promise<string> => {
  const Otp = await getOtpModel();

  // Invalidate any existing unused OTPs of the same type
  await Otp.deleteMany({ user_id: userId, type });

  const code = generateCode();
  await Otp.create({
    user_id:    userId,
    type,
    code_hash:  hashCode(code),
    expires_at: new Date(Date.now() + OTP_EXPIRY_MS),
  });

  return code;
};

export const verifyOtp = async (userId: string, type: OtpType, code: string): Promise<void> => {
  const Otp = await getOtpModel();
  const otp = await Otp.findOne({ user_id: userId, type });

  if (!otp || otp.expires_at < new Date()) {
    throw new AppError(ERRORS.INVALID_OR_EXPIRED, 400);
  }

  if (otp.attempts >= MAX_ATTEMPTS) {
    await Otp.findByIdAndDelete(otp._id);
    throw new AppError(ERRORS.TOO_MANY_ATTEMPTS, 429);
  }

  if (otp.code_hash !== hashCode(code)) {
    await Otp.findByIdAndUpdate(otp._id, { $inc: { attempts: 1 } });
    throw new AppError(ERRORS.INVALID_OR_EXPIRED, 400);
  }

  await Otp.findByIdAndDelete(otp._id);
};

export const invalidateOtps = async (userId: string, type: OtpType): Promise<void> => {
  const Otp = await getOtpModel();
  await Otp.deleteMany({ user_id: userId, type });
};
