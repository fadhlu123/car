import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../utils/error.utils';
import { verifyUserAccessToken, verifyAdminAccessToken } from '../services/auth.token.service';

const ERRORS = {
  NO_TOKEN:     'Authentication token is required',
  INVALID:      'Invalid or expired token',
  ADMIN_ONLY:   'Admin access required',
  OWNER_ONLY:   'Owner access required',
} as const;

const extractBearer = (req: Request): string | null => {
  const auth = req.headers.authorization;
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
};

/** Requires a valid user access token (signed with JWT_SECRET). */
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
 * Requires a valid admin access token (signed with JWT_ADMIN_SECRET).
 * Any admin_role ('owner' | 'staff') passes this gate.
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
 * Like adminProtect but additionally requires admin_role === 'owner'.
 * Use this for operations that only the business owner should perform:
 * inviting other admins, removing staff, viewing all audit logs, etc.
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
 * Attaches req.user if a valid token is present; continues silently if not.
 * Use on public routes that behave differently for authenticated users.
 */
export const optionalProtect = (req: Request, _res: Response, next: NextFunction): void => {
  const token = extractBearer(req);
  if (token) {
    try { req.user = verifyUserAccessToken(token); } catch { /* expected for public routes */ }
  }
  next();
};
