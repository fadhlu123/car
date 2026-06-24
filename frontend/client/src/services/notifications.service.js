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
