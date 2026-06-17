import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { sendSuccess, sendNoContent } from '../../../utils/response.utils';
import { validate, extractDeviceContext } from '../../../utils/request.utils';
import * as svc from '../services/admin.auth.service';
import { queryAuditLogs } from '../services/auth.audit.service';

// ── Schemas ───────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({ refresh_token: z.string().min(1) });

const auditQuerySchema = z.object({
  userId:    z.string().optional(),
  email:     z.string().optional(),
  event:     z.string().optional(),
  success:   z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate:   z.string().datetime().optional(),
  page:      z.coerce.number().int().min(1).default(1),
  limit:     z.coerce.number().int().min(1).max(100).default(20),
});

// ── Controllers ───────────────────────────────────────────────────────────────

export const adminLogin = [
  validate(loginSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.adminLogin(req.body.email, req.body.password, extractDeviceContext(req));
      sendSuccess(res, result, 'Admin login successful');
    } catch (err) { next(err); }
  },
];

export const adminLogout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = req.body?.session_id;
    if (sessionId) {
      await svc.adminLogout(sessionId, req.admin!.sub, extractDeviceContext(req));
    } else {
      // Revoke all admin sessions if no specific session_id given
      const { revokeAllAdminSessions } = await import('../services/auth.session.service');
      await revokeAllAdminSessions(req.admin!.sub);
    }
    sendNoContent(res);
  } catch (err) { next(err); }
};

export const adminRefresh = [
  validate(refreshSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await svc.adminRefresh(req.body.refresh_token, extractDeviceContext(req));
      sendSuccess(res, result, 'Admin token refreshed');
    } catch (err) { next(err); }
  },
];

export const getAdminProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await svc.getAdminProfile(req.admin!.sub);
    sendSuccess(res, profile, 'Profile retrieved');
  } catch (err) { next(err); }
};

export const getAdminSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessions = await svc.listAdminSessions(req.admin!.sub);
    sendSuccess(res, sessions, 'Sessions retrieved');
  } catch (err) { next(err); }
};

export const getAuditLogs = [
  validate(auditQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q     = req.query as any;
      const result = await queryAuditLogs({
        userId:    q.userId,
        email:     q.email,
        event:     q.event,
        success:   q.success !== undefined ? q.success === 'true' : undefined,
        startDate: q.startDate ? new Date(q.startDate) : undefined,
        endDate:   q.endDate   ? new Date(q.endDate)   : undefined,
        page:      Number(q.page),
        limit:     Number(q.limit),
      });
      sendSuccess(res, result, 'Audit logs retrieved');
    } catch (err) { next(err); }
  },
];
