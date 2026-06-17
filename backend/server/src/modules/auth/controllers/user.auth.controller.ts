import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendCreated, sendNoContent } from '../../../utils/response.utils';
import { validate, extractDeviceContext } from '../../../utils/request.utils';
import * as svc from '../services/user.auth.service';

// ── Schemas ───────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email:      z.string().email('Invalid email address'),
  password:   z.string().min(8, 'Password must be at least 8 characters'),
  first_name: z.string().min(1, 'First name is required'),
  last_name:  z.string().min(1, 'Last name is required'),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const refreshSchema    = z.object({ refresh_token: z.string().min(1) });
const googleSchema     = z.object({ id_token: z.string().min(1) });
const verifyOtpSchema  = z.object({ otp: z.string().length(6) });
const forgotSchema     = z.object({ email: z.string().email() });

const resetSchema = z.object({
  email:        z.string().email(),
  otp:          z.string().length(6),
  new_password: z.string().min(8),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password:     z.string().min(8),
});

const linkGoogleSchema = z.object({ id_token: z.string().min(1) });
const sessionIdSchema  = z.object({ id: z.string().min(1) });

// ── Controllers ───────────────────────────────────────────────────────────────

export const register = [
  validate(registerSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, first_name, last_name } = req.body;
      const ctx = extractDeviceContext(req);
      const result = await svc.register(email, password, first_name, last_name, ctx);
      sendCreated(res, result, 'Account created successfully');
    } catch (err) { next(err); }
  },
];

export const login = [
  validate(loginSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.login(req.body.email, req.body.password, extractDeviceContext(req));
      sendSuccess(res, result, 'Login successful');
    } catch (err) { next(err); }
  },
];

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ctx = extractDeviceContext(req);
    // Session id is embedded in the refresh token; for simple logout, revoke all or pass sessionId
    // For now: client sends the sessionId they want to revoke
    const sessionId = req.body?.session_id;
    if (sessionId) {
      await svc.logout(sessionId, req.user!.sub, ctx);
    } else {
      await svc.logoutAll(req.user!.sub, ctx);
    }
    sendNoContent(res);
  } catch (err) { next(err); }
};

export const refresh = [
  validate(refreshSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.refresh(req.body.refresh_token, extractDeviceContext(req));
      sendSuccess(res, result, 'Token refreshed');
    } catch (err) { next(err); }
  },
];

export const googleAuth = [
  validate(googleSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.googleAuth(req.body.id_token, extractDeviceContext(req));
      sendSuccess(res, result, 'Google authentication successful');
    } catch (err) { next(err); }
  },
];

export const linkGoogle = [
  validate(linkGoogleSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.linkGoogle(req.user!.sub, req.body.id_token, extractDeviceContext(req));
      sendSuccess(res, null, 'Google account linked successfully');
    } catch (err) { next(err); }
  },
];

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await svc.getProfile(req.user!.sub);
    sendSuccess(res, profile, 'Profile retrieved');
  } catch (err) { next(err); }
};

export const listSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await svc.listSessions(req.user!.sub);
    sendSuccess(res, sessions, 'Sessions retrieved');
  } catch (err) { next(err); }
};

export const deleteSession = [
  validate(sessionIdSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.deleteSession(req.params.id, req.user!.sub, extractDeviceContext(req));
      sendNoContent(res);
    } catch (err) { next(err); }
  },
];

export const verifyEmail = [
  validate(verifyOtpSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.verifyEmail(req.user!.sub, req.body.otp);
      sendSuccess(res, null, 'Email verified successfully');
    } catch (err) { next(err); }
  },
];

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await svc.resendVerification(req.user!.sub);
    sendSuccess(res, null, 'Verification email sent');
  } catch (err) { next(err); }
};

export const forgotPassword = [
  validate(forgotSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await svc.forgotPasswordRequest(req.body.email, extractDeviceContext(req));
      // Always 200 — never reveal if email exists
      sendSuccess(res, null, 'If that email exists, a reset code has been sent');
    } catch (err) { next(err); }
  },
];

export const resetPassword = [
  validate(resetSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp, new_password } = req.body;
      await svc.resetPassword(email, otp, new_password, extractDeviceContext(req));
      sendSuccess(res, null, 'Password reset successful. Please log in with your new password.');
    } catch (err) { next(err); }
  },
];

export const changePassword = [
  validate(changePasswordSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { current_password, new_password } = req.body;
      await svc.changePassword(req.user!.sub, req.user!.email, current_password, new_password, extractDeviceContext(req));
      sendSuccess(res, null, 'Password changed. Please log in again with your new password.');
    } catch (err) { next(err); }
  },
];
