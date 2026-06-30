import { Request } from 'express';

// ── Primitives ────────────────────────────────────────────────────────────────

export type AuthProvider = 'local' | 'google';

export type UserRole = 'user' | 'admin';

/** Distinguishes the first-party owner from staff admins added via invite. */
export type AdminRole = 'owner' | 'staff';

export type TokenType =
  | 'user_access'
  | 'admin_access'
  | 'user_refresh'
  | 'admin_refresh';

export type OtpType = 'email_verification' | 'password_reset';

export type AuditEvent =
  | 'register'
  | 'login_success'
  | 'login_failed'
  | 'account_locked'
  | 'account_unlocked'
  | 'account_deactivated'
  | 'account_activated'
  | 'logout'
  | 'logout_all'
  | 'token_refreshed'
  | 'password_changed'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_verified'
  | 'google_linked'
  | 'admin_login_success'
  | 'admin_login_failed'
  | 'admin_register'
  | 'admin_invited'
  | 'admin_invite_accepted'
  | 'admin_removed';

// ── Token payloads ────────────────────────────────────────────────────────────

/**
 * User access token — NO role claim.
 * Admin privilege is enforced exclusively via a separate token
 * signed with JWT_ADMIN_SECRET. Checking req.user.role is never
 * sufficient to gate admin resources.
 */
export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'user_access';
  iat?: number;
  exp?: number;
}

/**
 * Admin access token — includes admin_role so the frontend can
 * differentiate owner vs staff capabilities without an extra round-trip.
 */
export interface AdminAccessTokenPayload {
  sub: string;
  email: string;
  type: 'admin_access';
  admin_role: AdminRole;
  iat?: number;
  exp?: number;
}

/** Refresh tokens carry sessionId for O(1) DB lookup during rotation. */
export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  type: 'user_refresh' | 'admin_refresh';
  iat?: number;
  exp?: number;
}

// ── Shared shapes ─────────────────────────────────────────────────────────────

export interface UserSummary {
  id: string;
  email: string;
  role: UserRole;
  admin_role?: AdminRole;
  first_name: string;
  last_name: string;
  avatar_url: string;
  email_verified: boolean;
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: UserSummary;
}

export interface OAuthProfile {
  provider: AuthProvider;
  provider_id: string;
  email: string;
  first_name: string;
  last_name: string;
  avatar_url: string;
}

// ── Express augmentation ──────────────────────────────────────────────────────

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
      admin?: AdminAccessTokenPayload;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

export interface AdminRequest extends Request {
  admin: AdminAccessTokenPayload;
}
