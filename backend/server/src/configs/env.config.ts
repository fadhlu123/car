import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_ADMIN_SECRET: z.string().min(32, 'JWT_ADMIN_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // Cloudinary — Phase 3
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Email via Resend — Phase 5
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Google OAuth — Phase 1
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  ADMIN_REGISTRATION_KEY: z.string().optional(),

  // GitHub OAuth — Phase 1
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Account lockout — minutes a user is locked out after repeated failed logins
  LOCKOUT_DURATION_MINUTES: z.coerce.number().int().min(1).default(120),

  // Web Push / VAPID — Phase 6a
  // Generate with: npx web-push generate-vapid-keys
  VAPID_PUBLIC_KEY:  z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT:     z.string().optional(), // must be mailto: or https: URL

  // CORS — comma-separated list of allowed origins (client + admin dev/prod URLs)
  CLIENT_URL: z.string(),

  // Single-origin admin portal URL — used to build admin-facing email/push links
  // (invite links, new-order alerts). Keep separate from CLIENT_URL since that
  // one is a comma-joined CORS list, not a single safe link target.
  ADMIN_CLIENT_URL: z.string(),

  // Logging
  SERVICE_NAME: z.string().default('ecommerce-api'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('debug'),
  LOG_FILE_PATH: z.string().default('logs/app.log'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = {
  ...parsed.data,
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isProduction: parsed.data.NODE_ENV === 'production',
};

export type Env = typeof env;
