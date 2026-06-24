import React, { useEffect, useState } from 'react';
import { CheckCheck, RefreshCw, Bell, Users, ShoppingBag } from 'lucide-react';
import { getNotifications, getUnreadCount, markRead, markAllRead, getLiveStats } from '../services/notifications.service';
import { useAdminSSE } from '../hooks/useAdminSSE';
import { extractErrorMessage } from '../utils/error.utils';
import { formatDate } from '../utils/format.utils';

const timeAgo = (dateString) => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [stats, setStats] = useState({ connected_users: 0, connected_admins: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([getNotifications({ limit: 50 }), getUnreadCount(), getLiveStats()])
      .then(([feed, unreadCount, liveStats]) => {
        setItems(feed?.notifications || []);
        setUnread(unreadCount || 0);
        setStats(liveStats || { connected_users: 0, connected_admins: 0 });
      })
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useAdminSSE({
    notification: (item) => {
      if (!item) return;
      setItems((prev) => [item, ...prev.filter((x) => x.id !== item.id)].slice(0, 50));
      setUnread((count) => count + 1);
    },
    new_order: (item) => {
      if (!item) return;
      setItems((prev) => [item, ...prev.filter((x) => x.id !== item.id)].slice(0, 50));
      setUnread((count) => count + 1);
    },
  });

  const handleItemClick = async (item) => {
    if (item.is_read) return;
    try {
      await markRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n)));
      setUnread((count) => Math.max(0, count - 1));
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnread(0);
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-primary-400 text-sm mt-1">Admin alerts, live updates, and recent activity</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="btn-outline flex items-center gap-2 text-sm">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {unread > 0 && (
            <button onClick={handleMarkAllRead} className="btn-primary flex items-center gap-2 text-sm">
              <CheckCheck className="h-4 w-4" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary-800 flex items-center justify-center"><Bell className="h-5 w-5 text-accent" /></div>
          <div>
            <p className="text-xs text-primary-400">Unread</p>
            <p className="text-2xl font-bold text-white">{unread}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary-800 flex items-center justify-center"><Users className="h-5 w-5 text-accent" /></div>
          <div>
            <p className="text-xs text-primary-400">Connected admins</p>
            <p className="text-2xl font-bold text-white">{stats.connected_admins}</p>
          </div>
        </div>
        <div className="card p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-primary-800 flex items-center justify-center"><ShoppingBag className="h-5 w-5 text-accent" /></div>
          <div>
            <p className="text-xs text-primary-400">Connected users</p>
            <p className="text-2xl font-bold text-white">{stats.connected_users}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center text-primary-400">
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-primary-800/50">
            {items.map((item) => (
              <li
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`px-6 py-4 cursor-pointer hover:bg-primary-800/40 transition-colors ${item.is_read ? 'opacity-65' : 'bg-primary-800/20'}`}
              >
                <div className="flex items-start gap-3">
                  {!item.is_read && <span className="mt-2 h-2 w-2 rounded-full bg-accent flex-shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-white font-medium truncate">{item.title}</p>
                      <span className="text-[10px] text-primary-500 flex-shrink-0">{timeAgo(item.created_at)}</span>
                    </div>
                    <p className="text-sm text-primary-400 mt-1">{item.body}</p>
                    <p className="text-[11px] text-primary-600 mt-2">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Notifications;
