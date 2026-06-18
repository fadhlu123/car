import { CorsOptions } from 'cors';
import { env } from './env.config';
import { createLogger } from '../utils/logger.utils';

const logger = createLogger('cors');

const ALLOWED_ORIGINS = env.CLIENT_URL
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Requests with no origin header (Postman, mobile apps, server-to-server)
    // are allowed freely in dev; blocked in production for safety.
    if (!origin) {
      return env.isDevelopment ? callback(null, true) : callback(null, false);
    }

    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);

    logger.warn('CORS blocked request from unknown origin', { origin });
    callback(new Error('Not allowed by CORS'));
  },

  credentials:    true,
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id'],

  // Cache preflight responses for 24 h — reduces OPTIONS round-trips.
  maxAge: 86_400,
};
