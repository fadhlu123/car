import { apiClient } from './apiClient';

export const listConversations = (params = {}) =>
  apiClient.get('/admin/contact/conversations', { params }).then(r => r.data.data);

export const getConversation = (id) =>
  apiClient.get(`/admin/contact/conversations/${id}`).then(r => r.data.data);

export const sendReply = (id, body) =>
  apiClient.post(`/admin/contact/conversations/${id}/messages`, { body }).then(r => r.data.data);

export const markSeen = (id) =>
  apiClient.post(`/admin/contact/conversations/${id}/seen`).then(r => r.data);
