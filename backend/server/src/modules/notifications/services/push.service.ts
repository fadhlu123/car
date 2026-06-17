import webpush from 'web-push';
import { env } from '../../../configs/env.config';
import { createLogger } from '../../../utils/logger.utils';
import { getPushSubscriptionModel } from '../models/push-subscription.model';

const logger = createLogger('push-service');

export interface PushPayload {
  title:   string;
  body:    string;
  url?:    string;
  icon?:   string;
  badge?:  string;
  tag?:    string;
}

let _vapidReady = false;

const initVapid = (): boolean => {
  if (_vapidReady) return true;
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  _vapidReady = true;
  return true;
};

export const isVapidConfigured = (): boolean => initVapid();

export const getVapidPublicKey = (): string | undefined => env.VAPID_PUBLIC_KEY;

export const saveSubscription = async (
  userId:        string,
  recipientType: 'user' | 'admin',
  endpoint:      string,
  keys:          { p256dh: string; auth: string },
  userAgent?:    string
): Promise<void> => {
  const Model = await getPushSubscriptionModel();
  await Model.findOneAndUpdate(
    { endpoint },
    { $set: { user_id: userId, recipient_type: recipientType, keys, user_agent: userAgent ?? '' } },
    { upsert: true }
  );
};

export const removeSubscription = async (userId: string, endpoint: string): Promise<void> => {
  const Model = await getPushSubscriptionModel();
  await Model.deleteOne({ endpoint, user_id: userId });
};

const deliverPush = async (
  Model:    Awaited<ReturnType<typeof getPushSubscriptionModel>>,
  endpoint: string,
  id:       unknown,
  json:     string
): Promise<void> => {
  try {
    const sub = await Model.findOne({ endpoint }).lean();
    if (!sub) return;
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      json
    );
  } catch (err: any) {
    if (err.statusCode === 410 || err.statusCode === 404) {
      await Model.deleteOne({ _id: id }).catch(() => null);
      logger.debug('Removed expired push subscription', { endpoint });
    } else {
      logger.warn('Push delivery failed', { endpoint, error: err.message });
    }
  }
};

export const sendPushToUser = async (userId: string, payload: PushPayload): Promise<void> => {
  if (!initVapid()) { logger.debug('Push skipped — VAPID not configured'); return; }

  const Model = await getPushSubscriptionModel();
  const subs  = await Model.find({ user_id: userId, recipient_type: 'user' }).lean();
  if (!subs.length) return;

  const json = JSON.stringify(payload);
  await Promise.allSettled(subs.map((s) => deliverPush(Model, s.endpoint, s._id, json)));
};

export const sendPushToAllAdmins = async (payload: PushPayload): Promise<void> => {
  if (!initVapid()) { logger.debug('Push skipped — VAPID not configured'); return; }

  const Model = await getPushSubscriptionModel();
  const subs  = await Model.find({ recipient_type: 'admin' }).lean();
  if (!subs.length) return;

  const json = JSON.stringify(payload);
  await Promise.allSettled(subs.map((s) => deliverPush(Model, s.endpoint, s._id, json)));
};
