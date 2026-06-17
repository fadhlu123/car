import { dispatch } from '../../notifications/services/notification.dispatcher';

export const sendPasswordResetEmail = (
  email:     string,
  otp:       string,
  firstName: string,
  userId?:   string
): Promise<void> =>
  dispatch({ type: 'password_reset', email, otp, firstName, userId });

export const sendEmailVerificationEmail = (
  email:     string,
  otp:       string,
  firstName: string,
  userId?:   string
): Promise<void> =>
  dispatch({ type: 'email_verification', email, otp, firstName, userId });

export const sendWelcomeEmail = (
  userId:    string,
  email:     string,
  firstName: string
): Promise<void> =>
  dispatch({ type: 'welcome', userId, email, firstName });

export const sendLoginAlertEmail = (
  email:     string,
  ip:        string,
  device:    string,
  time:      string,
  firstName  = 'there',
  userId?:   string
): Promise<void> =>
  dispatch({ type: 'new_device_login', email, ip, device, time, firstName, userId });

export const notifyAccountLocked = (
  userId:    string,
  email:     string,
  firstName: string
): Promise<void> =>
  dispatch({ type: 'account_locked', userId, email, firstName });

export const notifyAccountUnlocked = (userId: string, email: string, firstName?: string): Promise<void> =>
  dispatch({ type: 'account_unlocked', userId, email, firstName });

export const notifyAccountDeactivated = (userId: string, email: string): Promise<void> =>
  dispatch({ type: 'account_deactivated', userId, email });

export const notifyAccountActivated = (userId: string, email: string): Promise<void> =>
  dispatch({ type: 'account_activated', userId, email });

export const notifyPasswordChanged = (
  userId:    string,
  email:     string,
  firstName: string
): Promise<void> =>
  dispatch({ type: 'password_changed', userId, email, firstName });
