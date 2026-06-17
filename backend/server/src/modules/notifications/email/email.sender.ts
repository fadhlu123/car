import nodemailer from 'nodemailer';
import { env } from '../../../configs/env.config';
import { createLogger } from '../../../utils/logger.utils';

const logger = createLogger('email-sender');

// Lazily created — avoids crashing on startup if RESEND_API_KEY is absent
let _transport: ReturnType<typeof nodemailer.createTransport> | null = null;

const getTransport = () => {
  if (!env.RESEND_API_KEY) return null;
  if (_transport) return _transport;
  _transport = nodemailer.createTransport({
    host:   'smtp.resend.com',
    port:   587,
    secure: false,
    auth:   { user: 'resend', pass: env.RESEND_API_KEY },
  });
  return _transport;
};

export interface EmailPayload {
  to:      string;
  subject: string;
  html:    string;
}

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const transport = getTransport();

  if (!transport) {
    logger.warn(`[EMAIL SKIP] RESEND_API_KEY not set — skipped "${payload.subject}" to ${payload.to}`);
    return;
  }

  try {
    await transport.sendMail({
      from:    env.EMAIL_FROM ?? 'noreply@example.com',
      to:      payload.to,
      subject: payload.subject,
      html:    payload.html,
    });
    logger.info(`Email sent → ${payload.to} | ${payload.subject}`);
  } catch (err: any) {
    // Log but never throw — email failures must not surface to the caller
    logger.error(`Email delivery failed → ${payload.to} | ${err.message}`);
  }
};
