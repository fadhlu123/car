import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../services/notifications.service';
import { useAdminSSE } from '../hooks/useAdminSSE';
import { extractErrorMessage } from '../utils/error.utils';

const timeAgo = (dateString) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const NotificationBell = () => {
  const [open, setOpen]         = useState(false);
  const [items, setItems]       = useState([]);
  const [unread, setUnread]     = useState(0);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    getUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useAdminSSE({
    notification: (n) => {
      if (n) setItems((prev) => [n, ...prev].slice(0, 20));
      setUnread((c) => c + 1);
    },
    new_order: (n) => {
      if (n) setItems((prev) => [n, ...prev].slice(0, 20));
      setUnread((c) => c + 1);
    },
  });

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      setError('');
      getNotifications({ limit: 20 })
        .then((d) => setItems(d?.notifications || []))
        .catch((e) => setError(extractErrorMessage(e)))
        .finally(() => setLoading(false));
    }
  };

  const handleItemClick = async (item) => {
    if (item.is_read) return;
    try {
      await markRead(item.id);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_read: true } : i)));
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  return (
    <div className="relative">
      <button onClick={toggle} className="relative p-2 text-primary-300 hover:text-white hover:bg-primary-800 rounded-lg transition-colors">
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold leading-none text-primary-950 bg-accent rounded-full">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-primary-900 border border-primary-800 rounded-2xl shadow-xl z-50 max-h-[28rem] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-primary-800">
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unread > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-accent flex items-center gap-1 hover:underline">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent" />
              </div>
            ) : error ? (
              <p className="text-xs text-red-400 px-4 py-6">{error}</p>
            ) : items.length === 0 ? (
              <p className="text-xs text-primary-500 px-4 py-8 text-center">No notifications yet.</p>
            ) : (
              <ul className="divide-y divide-primary-800/50">
                {items.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`px-4 py-3 cursor-pointer transition-colors ${item.is_read ? 'opacity-60' : 'bg-primary-800/30'} hover:bg-primary-800/60`}
                  >
                    <div className="flex items-start gap-2">
                      {!item.is_read && <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm text-white font-medium truncate">{item.title}</p>
                        <p className="text-xs text-primary-400 line-clamp-2">{item.body}</p>
                        <p className="text-[10px] text-primary-600 mt-1">{timeAgo(item.created_at)}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
