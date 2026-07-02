import { apiClient } from './apiClient';

export const getNotifications = (params = {}) =>
  apiClient.get('/notifications', { params }).then(r => r.data.data);

export const getUnreadCount = () =>
  apiClient.get('/notifications/unread-count').then(r => r.data.data.unread_count);

export const getBroadcasts = () =>
  apiClient.get('/notifications/broadcasts').then(r => r.data.data);

export const markRead = (id) =>
  apiClient.patch(`/notifications/${id}/read`);

export const markAllRead = () =>
  apiClient.patch('/notifications/read-all');

export const getVapidKey = () =>
  apiClient.get('/notifications/push/vapid-key').then(r => r.data.data.public_key);

export const subscribePush = (subscription) =>
  apiClient.post('/notifications/push/subscribe', subscription).then(r => r.data);

export const unsubscribePush = (endpoint) =>
  apiClient.delete('/notifications/push/unsubscribe', { data: { endpoint } }).then(r => r.data);
