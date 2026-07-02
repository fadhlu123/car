import { apiClient } from './apiClient';

export const getNotifications = (params = {}) =>
  apiClient.get('/admin/notifications', { params }).then(r => r.data.data);

export const getUnreadCount = () =>
  apiClient.get('/admin/notifications/unread-count').then(r => r.data.data.unread_count);

export const markRead = (id) =>
  apiClient.patch(`/admin/notifications/${id}/read`);

export const markAllRead = () =>
  apiClient.patch('/admin/notifications/read-all');

export const getBroadcasts = (params = {}) =>
  apiClient.get('/admin/notifications/broadcasts', { params }).then(r => r.data.data);

const isFormData = (value) => typeof FormData !== 'undefined' && value instanceof FormData;

export const createBroadcast = (data) =>
  apiClient.post('/admin/notifications/broadcasts', data, isFormData(data)
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined
  ).then(r => r.data.data);

export const updateBroadcast = (id, data) =>
  apiClient.patch(`/admin/notifications/broadcasts/${id}`, data, isFormData(data)
    ? { headers: { 'Content-Type': 'multipart/form-data' } }
    : undefined
  ).then(r => r.data.data);

export const deleteBroadcast = (id) =>
  apiClient.delete(`/admin/notifications/broadcasts/${id}`);

export const getLiveStats = () =>
  apiClient.get('/admin/notifications/live-stats').then(r => r.data.data);

export const getVapidKey = () =>
  apiClient.get('/notifications/push/vapid-key').then(r => r.data.data.public_key);

export const subscribePush = (subscription) =>
  apiClient.post('/admin/notifications/push/subscribe', subscription).then(r => r.data);

export const unsubscribePush = (endpoint) =>
  apiClient.delete('/admin/notifications/push/unsubscribe', { data: { endpoint } }).then(r => r.data);
