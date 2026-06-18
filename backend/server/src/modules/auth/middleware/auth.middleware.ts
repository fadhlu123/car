import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/error.utils';
import { verifyUserAccessToken, verifyAdminAccessToken } from '../services/auth.token.service';
import { getUserModel } from '../models/user.model';

const ERRORS = {
  NO_TOKEN:   'Authentication token is required',
  INVALID:    'Invalid or expired token',
  ADMIN_ONLY: 'Admin access required',
  OWNER_ONLY: 'Owner access required',
  UNVERIFIED: 'Please verify your email address to access this resource',
  INACTIVE:   'Your account has been deactivated. Contact support.',
} as const;

const extractBearer = (req: Request): string | null => {
  const auth = req.headers.authorization;
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
};

// ── Core guards ───────────────────────────────────────────────────────────────

/**
 * Requires a valid user access token (JWT_SECRET).
 * Sets req.user — all downstream handlers can safely read req.user!.sub / .email.
 */
export const protect = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearer(req);
  if (!token) return next(new AppError(ERRORS.NO_TOKEN, 401));
  try {
    req.user = verifyUserAccessToken(token);
    next();
  } catch {
    next(new AppError(ERRORS.INVALID, 401));
  }
};

/**
 * Requires a valid admin access token (JWT_ADMIN_SECRET).
 * Passes for both 'owner' and 'staff' admin roles.
 * Sets req.admin.
 */
export const adminProtect = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearer(req);
  if (!token) return next(new AppError(ERRORS.NO_TOKEN, 401));
  try {
    req.admin = verifyAdminAccessToken(token);
    next();
  } catch {
    next(new AppError(ERRORS.ADMIN_ONLY, 403));
  }
};

/**
 * Requires a valid admin token AND admin_role === 'owner'.
 * Use for invite management, staff removal, and other owner-only operations.
 */
export const ownerProtect = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearer(req);
  if (!token) return next(new AppError(ERRORS.NO_TOKEN, 401));
  try {
    const payload = verifyAdminAccessToken(token);
    if (payload.admin_role !== 'owner') return next(new AppError(ERRORS.OWNER_ONLY, 403));
    req.admin = payload;
    next();
  } catch {
    next(new AppError(ERRORS.ADMIN_ONLY, 403));
  }
};

/**
 * Attaches req.user if a valid user token is present; continues silently if not.
 * Use on public routes that behave differently for authenticated users
 * (e.g., guest vs. logged-in order submission).
 */
export const optionalProtect = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearer(req);
  if (token) {
    try { req.user = verifyUserAccessToken(token); } catch { /* no-op on public routes */ }
  }
  next();
};

/**
 * Stack after `protect` on routes that require verified email.
 * Does a real-time DB check so it's accurate regardless of token age.
 *
 * Example:
 *   router.post('/orders', protect, requireVerified, ...ctrl.submitOrder);
 */
export const requireVerified = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) return next(new AppError(ERRORS.NO_TOKEN, 401));
    const User = await getUserModel();
    const user = await User.findById(req.user.sub).select('email_verified is_active').lean();
    if (!user?.is_active)     return next(new AppError(ERRORS.INACTIVE,   403));
    if (!user.email_verified) return next(new AppError(ERRORS.UNVERIFIED, 403));
    next();
  } catch (err) {
    next(err);
  }
};

// ── Semantic aliases ──────────────────────────────────────────────────────────
// These are identical in behaviour to the guards above — the different names
// make route files self-documenting about who is allowed in.
//
// Usage:
//   import { isUser, isAdmin, isOwner } from '../auth/middleware/auth.middleware';
//   router.get('/profile',       isUser,  ctrl.getProfile);
//   router.get('/admin/users',   isAdmin, ctrl.listUsers);
//   router.post('/admin/invite', isOwner, ctrl.invite);

export const isUser   = protect;          // any authenticated user
export const isAdmin  = adminProtect;     // any admin (owner or staff)
export const isStaff  = adminProtect;     // staff or owner — explicit alias for clarity
export const isOwner  = ownerProtect;     // owner only
export const isPublic = optionalProtect;  // public route, enriched when user is logged in
