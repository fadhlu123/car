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

// Strips HTML tags so the OTP / body is readable in the terminal
const stripHtml = (html: string) =>
  html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

const devPrint = (payload: EmailPayload): void => {
  if (!env.isDevelopment) return;
  const border = '─'.repeat(60);
  console.log(`\n┌${border}┐`);
  console.log(`│  [DEV EMAIL]`);
  console.log(`│  To      : ${payload.to}`);
  console.log(`│  Subject : ${payload.subject}`);
  console.log(`│  Body    :`);
  stripHtml(payload.html)
    .split('\n')
    .filter(Boolean)
    .forEach(line => console.log(`│    ${line}`));
  console.log(`└${border}┘\n`);
};

export const sendEmail = async (payload: EmailPayload): Promise<void> => {
  const transport = getTransport();

  if (!transport) {
    logger.warn(`[EMAIL SKIP] RESEND_API_KEY not set — skipped "${payload.subject}" to ${payload.to}`);
    devPrint(payload);
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
    devPrint(payload);
  } catch (err: any) {
    // Log but never throw — email failures must not surface to the caller
    logger.error(`Email delivery failed → ${payload.to} | ${err.message}`);
    devPrint(payload);
  }
};
