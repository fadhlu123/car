import { Router, type Router as RouterType } from 'express';
import rateLimit from 'express-rate-limit';
import { protect, adminProtect } from '../middleware/auth.middleware';
import * as user  from '../controllers/user.auth.controller';
import * as admin from '../controllers/admin.auth.controller';

// Strict rate limit for credential endpoints: 10 attempts per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, message: 'Too many requests. Please try again later.', data: null },
});

const router: RouterType = Router();

// ── User auth ─────────────────────────────────────────────────────────────────
router.post('/register',             authLimiter, ...user.register);
router.post('/login',                authLimiter, ...user.login);
router.post('/logout',               protect, user.logout);
router.post('/refresh',              ...user.refresh);
router.post('/google',               authLimiter, ...user.googleAuth);

// Email verification
router.post('/verify-email',         protect, ...user.verifyEmail);
router.post('/resend-verification',  protect, user.resendVerification);

// Password management
router.post('/forgot-password',      authLimiter, ...user.forgotPassword);
router.post('/reset-password',       authLimiter, ...user.resetPassword);
router.patch('/change-password',     protect, ...user.changePassword);

// Account linking
router.post('/link/google',          protect, ...user.linkGoogle);

// Profile + sessions
router.get( '/me',                   protect, user.getProfile);
router.get( '/sessions',             protect, user.listSessions);
router.delete('/sessions/:id',       protect, ...user.deleteSession);

// ── Admin auth ────────────────────────────────────────────────────────────────
router.post('/admin/login',          authLimiter, ...admin.adminLogin);
router.post('/admin/logout',         adminProtect, admin.adminLogout);
router.post('/admin/refresh',        ...admin.adminRefresh);
router.get( '/admin/me',             adminProtect, admin.getAdminProfile);
router.get( '/admin/sessions',       adminProtect, admin.getAdminSessions);
router.get( '/admin/audit-logs',     adminProtect, ...admin.getAuditLogs);

export default router;
