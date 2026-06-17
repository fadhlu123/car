import { OAuth2Client } from 'google-auth-library';
import { env } from '../../../configs/env.config';
import { createLogger } from '../../../utils/logger.utils';
import { OAuthProfile } from '../types/auth.types';

const logger = createLogger('auth-google');

const ERRORS = {
  INVALID_TOKEN:    'Could not verify Google credentials',
  EMAIL_UNVERIFIED: 'Google account email is not verified',
} as const;

const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (id_token: string): Promise<OAuthProfile> => {
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken:  id_token,
      audience: env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    logger.warn('Google token verification failed', { err });
    throw new Error(ERRORS.INVALID_TOKEN);
  }

  if (!payload) throw new Error(ERRORS.INVALID_TOKEN);
  if (!payload.email_verified) throw new Error(ERRORS.EMAIL_UNVERIFIED);

  return {
    provider:    'google',
    provider_id: payload.sub,
    email:       payload.email!,
    first_name:  payload.given_name  ?? '',
    last_name:   payload.family_name ?? '',
    avatar_url:  payload.picture     ?? '',
  };
};
