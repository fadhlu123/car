import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../../configs/env.config';
import {
  AccessTokenPayload,
  AdminAccessTokenPayload,
  AdminRole,
  RefreshTokenPayload,
} from '../types/auth.types';

// Access tokens are intentionally short-lived; refresh tokens handle longevity.
const ACCESS_TTL        = '15m';
const USER_REFRESH_TTL  = '30d';
const ADMIN_REFRESH_TTL = '8h';

const ERRORS = {
  INVALID_TOKEN: 'Invalid or expired token',
} as const;

// ── Shared util ───────────────────────────────────────────────────────────────

/** SHA-256 of the raw refresh token — what we store in the DB, never the token itself. */
export const hashToken = (raw: string): string =>
  crypto.createHash('sha256').update(raw).digest('hex');

// ── User access token ─────────────────────────────────────────────────────────

export const signUserAccessToken = (sub: string, email: string): string =>
  jwt.sign(
    { sub, email, type: 'user_access' } satisfies Omit<AccessTokenPayload, 'iat' | 'exp'>,
    env.JWT_SECRET,
    { expiresIn: ACCESS_TTL } as SignOptions
  );

export const verifyUserAccessToken = (token: string): AccessTokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
    if (payload.type !== 'user_access') throw new Error();
    return payload;
  } catch {
    throw new Error(ERRORS.INVALID_TOKEN);
  }
};

// ── Admin access token ────────────────────────────────────────────────────────

export const signAdminAccessToken = (sub: string, email: string, adminRole: AdminRole): string =>
  jwt.sign(
    { sub, email, type: 'admin_access', admin_role: adminRole } satisfies Omit<AdminAccessTokenPayload, 'iat' | 'exp'>,
    env.JWT_ADMIN_SECRET,
    { expiresIn: ACCESS_TTL } as SignOptions
  );

export const verifyAdminAccessToken = (token: string): AdminAccessTokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminAccessTokenPayload;
    if (payload.type !== 'admin_access') throw new Error();
    return payload;
  } catch {
    throw new Error(ERRORS.INVALID_TOKEN);
  }
};

// ── User refresh token ────────────────────────────────────────────────────────

export const signUserRefreshToken = (sub: string, sessionId: string): string =>
  jwt.sign(
    { sub, sessionId, type: 'user_refresh' } satisfies Omit<RefreshTokenPayload, 'iat' | 'exp'>,
    env.JWT_SECRET,
    { expiresIn: USER_REFRESH_TTL } as SignOptions
  );

export const verifyUserRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as RefreshTokenPayload;
    if (payload.type !== 'user_refresh') throw new Error();
    return payload;
  } catch {
    throw new Error(ERRORS.INVALID_TOKEN);
  }
};

// ── Admin refresh token ───────────────────────────────────────────────────────

export const signAdminRefreshToken = (sub: string, sessionId: string): string =>
  jwt.sign(
    { sub, sessionId, type: 'admin_refresh' } satisfies Omit<RefreshTokenPayload, 'iat' | 'exp'>,
    env.JWT_ADMIN_SECRET,
    { expiresIn: ADMIN_REFRESH_TTL } as SignOptions
  );

export const verifyAdminRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const payload = jwt.verify(token, env.JWT_ADMIN_SECRET) as RefreshTokenPayload;
    if (payload.type !== 'admin_refresh') throw new Error();
    return payload;
  } catch {
    throw new Error(ERRORS.INVALID_TOKEN);
  }
};

export const USER_REFRESH_MS  = 30 * 24 * 60 * 60 * 1000;  // 30 days
export const ADMIN_REFRESH_MS =  8 * 60 * 60 * 1000;        // 8 hours
