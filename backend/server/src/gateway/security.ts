import { RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('security');

// ── NoSQL injection sanitizer ─────────────────────────────────────────────────
// Strips MongoDB operator keys (anything starting with '$') from user-supplied
// data before it reaches any service or model layer.
// Guards against payloads like: { "email": { "$gt": "" } }

const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([k]) => !k.startsWith('$'))
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return value;
};

export const mongoSanitize: RequestHandler = (req, _res, next) => {
  if (req.body)   req.body   = sanitize(req.body);
  if (req.query)  req.query  = sanitize(req.query)  as typeof req.query;
  if (req.params) req.params = sanitize(req.params) as typeof req.params;
  next();
};

// ── Request ID ────────────────────────────────────────────────────────────────
// Every request gets a unique ID stamped on both the incoming headers and the
// response. Clients may supply their own via X-Request-Id for end-to-end tracing.

export const requestId: RequestHandler = (req, res, next) => {
  const id =
    (req.headers['x-request-id'] as string) ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};

// ── Global rate limiter ───────────────────────────────────────────────────────
// Broad outer guard: 300 req / 15 min per IP across all API routes.
// Auth credential endpoints (login, register, forgot-password) sit behind their
// own tighter limiter (10 req / 15 min) inside auth.routes.ts — these two layers
// work together, not in conflict.

export const globalLimiter: RequestHandler = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
    data:    null,
  },
  skip: (req) => req.path === '/health',
  handler: (req, res, _next, options) => {
    logger.warn('Global rate limit exceeded', { ip: req.ip, path: req.path });
    res.status(429).json(options.message);
  },
});
