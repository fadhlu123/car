import React, { useState, useEffect } from 'react';
import { Megaphone, X } from 'lucide-react';
import { getBroadcasts } from '../services/notifications.service';
import { useSSE } from '../hooks/useSSE';

const DISMISSED_KEY = 'am_dismissed_broadcasts';

const getDismissed = () => {
  try { return JSON.parse(localStorage.getItem(DISMISSED_KEY)) || []; }
  catch { return []; }
};

const addDismissed = (id) => {
  const next = [...getDismissed(), id].slice(-50); // cap so it doesn't grow forever
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
};

// Site-wide announcement bar. Visible to guests too (the broadcasts endpoint is
// public) — live SSE updates only apply once a user is logged in, since the
// stream requires an access token.
const BroadcastBanner = () => {
  const [broadcasts, setBroadcasts] = useState([]);

  useEffect(() => {
    getBroadcasts()
      .then((list) => {
        const dismissed = getDismissed();
        setBroadcasts((list || []).filter((b) => !dismissed.includes(b.id)));
      })
      .catch(() => {});
  }, []);

  useSSE({
    broadcast: (b) => {
      if (!b) return;
      const dismissed = getDismissed();
      if (dismissed.includes(b.id)) return;
      setBroadcasts((prev) => [b, ...prev.filter((x) => x.id !== b.id)]);
    },
    broadcast_removed: (payload) => {
      if (!payload?.id) return;
      setBroadcasts((prev) => prev.filter((b) => b.id !== payload.id));
    },
  });

  const dismiss = (id) => {
    addDismissed(id);
    setBroadcasts((prev) => prev.filter((b) => b.id !== id));
  };

  if (broadcasts.length === 0) return null;

  return (
    <div className="relative z-50">
      {broadcasts.map((b) => (
        <div key={b.id} className="bg-accent text-primary-950 px-4 py-2.5 text-sm font-medium">
          <div className="flex items-center gap-3">
            <Megaphone className="h-4 w-4 flex-shrink-0" />
            {b.image_url && (
              <img
                src={b.image_url}
                alt=""
                className="h-10 w-10 rounded-lg object-cover flex-shrink-0 border border-primary-950/10"
              />
            )}
            <span className="min-w-0 flex-1 truncate">
              <span className="font-semibold">{b.title}</span>
              {b.body && <span className="ml-1.5 opacity-90">{b.body}</span>}
            </span>
            {b.cta_url && (
              <a href={b.cta_url} target="_blank" rel="noopener noreferrer" className="underline font-semibold flex-shrink-0">
                {b.cta_label || 'Learn more'}
              </a>
            )}
            <button onClick={() => dismiss(b.id)} className="flex-shrink-0 p-1 hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BroadcastBanner;
