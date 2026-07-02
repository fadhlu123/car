import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getVapidKey, subscribePush } from '../services/notifications.service';
import { urlBase64ToUint8Array } from '../utils/push.utils';

/**
 * Registers the service worker and subscribes to web push once an admin is
 * logged in. Silently no-ops if the browser lacks push support or the
 * server has no VAPID key configured.
 */
export const usePush = () => {
  const { admin } = useAuth();

  useEffect(() => {
    if (!admin) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    let cancelled = false;

    const subscribe = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        const existing = await registration.pushManager.getSubscription();
        if (existing || cancelled) return;

        const vapidKey = await getVapidKey();
        if (!vapidKey || cancelled) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
        if (!cancelled) await subscribePush(subscription.toJSON());
      } catch (err) {
        console.error('Push subscription failed:', err);
      }
    };

    subscribe();
    return () => { cancelled = true; };
  }, [admin]);
};
