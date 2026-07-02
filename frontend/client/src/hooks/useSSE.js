import { useEffect, useRef } from 'react';
import { ENV } from '../configs/env.config';
import { getAccessToken } from '../utils/storage.utils';

const EVENTS = ['notification', 'broadcast', 'broadcast_removed', 'chat_message'];

// Browser EventSource can't refresh its URL, so the access token it was opened
// with goes stale after 15 min. We tear down and reopen on an interval so the
// stream keeps using whatever token the axios refresh flow has since rotated in.
const RECONNECT_MS = 10 * 60 * 1000;

export const useSSE = (handlers = {}) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    let es = null;

    const connect = () => {
      const token = getAccessToken();
      if (!token) return;

      es = new EventSource(`${ENV.API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`);

      EVENTS.forEach((event) => {
        es.addEventListener(event, (e) => {
          const handler = handlersRef.current[event];
          if (!handler) return;
          try { handler(JSON.parse(e.data)); } catch { handler(null); }
        });
      });
    };

    connect();
    const interval = setInterval(() => { es?.close(); connect(); }, RECONNECT_MS);

    return () => {
      clearInterval(interval);
      es?.close();
    };
  }, []);
};
