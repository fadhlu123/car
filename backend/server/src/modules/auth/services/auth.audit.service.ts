import { createLogger } from '../../../utils/logger.utils';
import { getAuditModel } from '../../../models/audit.model';
import { AuditEvent } from '../types/auth.types';

const logger = createLogger('auth-audit');

export interface AuditInput {
  userId?: string;
  email?: string;
  event: AuditEvent;
  success: boolean;
  ip_address: string;
  user_agent: string;
  metadata?: Record<string, unknown>;
  /** Persist to DB. Only set true for critical security events (failed logins, lockouts, password changes). */
  persist?: boolean;
}

export const logEvent = async (input: AuditInput): Promise<void> => {
  // Always surface to Winston — visible in terminal regardless of DB write
  const logMeta = {
    ...(input.userId     && { userId:   input.userId }),
    ...(input.email      && { email:    input.email }),
    ...(input.ip_address && { ip:       input.ip_address }),
    ...(input.metadata   && { metadata: input.metadata }),
    success: input.success,
  };

  if (input.success) {
    logger.info(`audit:${input.event}`, logMeta);
  } else {
    logger.warn(`audit:${input.event}`, logMeta);
  }

  if (!input.persist) return;

  try {
    const Audit = await getAuditModel();
    await Audit.create({
      user_id:    input.userId,
      email:      input.email,
      event:      input.event,
      success:    input.success,
      ip:         input.ip_address,
      user_agent: input.user_agent,
      metadata:   input.metadata,
    });
  } catch (err) {
    logger.warn('Failed to write audit log to DB', { event: input.event, err });
  }
};

export interface AuditQuery {
  userId?: string;
  email?: string;
  event?: AuditEvent;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export const queryAuditLogs = async (query: AuditQuery) => {
  const Audit = await getAuditModel();
  const filter: Record<string, unknown> = {};

  if (query.userId)    filter.user_id = query.userId;
  if (query.email)     filter.email   = query.email;
  if (query.event)     filter.event   = query.event;
  if (query.success !== undefined) filter.success = query.success;
  if (query.startDate || query.endDate) {
    filter.created_at = {} as Record<string, Date>;
    if (query.startDate) (filter.created_at as Record<string, Date>).$gte = query.startDate;
    if (query.endDate)   (filter.created_at as Record<string, Date>).$lte = query.endDate;
  }

  const page  = Math.max(1, query.page  ?? 1);
  const limit = Math.min(100, query.limit ?? 20);
  const skip  = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    Audit.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Audit.countDocuments(filter),
  ]);

  return { logs, total, page, limit, pages: Math.ceil(total / limit) };
};
