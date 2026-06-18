import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions } from './configs/cors.config';
import { helmetOptions } from './configs/helmet.config';
import { requestId, globalLimiter, mongoSanitize } from './gateway/security';
import { notFound, errorHandler } from './utils/error.utils';
import { sendSuccess } from './utils/response.utils';
import gateway from './gateway';

const app: Application = express();

// ── Trust proxy ───────────────────────────────────────────────────────────────
// Required when running behind nginx / a cloud load balancer so that req.ip
// reflects the real client address (X-Forwarded-For) instead of the proxy IP.
// Without this, every request looks like it comes from the same IP and rate
// limiting is completely ineffective.
app.set('trust proxy', 1);

// ── Security layer ────────────────────────────────────────────────────────────
// Order matters: ID → headers → CORS → rate limit → body → sanitize
app.use(requestId);                                       // trace ID on every request/response
app.use(helmet(helmetOptions));                           // security response headers
app.use(cors(corsOptions));                               // CORS origin validation
app.use(globalLimiter);                                   // 300 req / 15 min per IP (global ceiling)

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Input sanitization ────────────────────────────────────────────────────────
// Must come after body parsing — strips MongoDB operators ($gt, $where, etc.)
// from req.body, req.query, and req.params before they reach any route handler.
app.use(mongoSanitize);

// ── API gateway ───────────────────────────────────────────────────────────────
app.use(gateway);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  sendSuccess(res, { uptime: Math.floor(process.uptime()) }, 'Server is healthy');
});

// ── Error handling — must be last ─────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
