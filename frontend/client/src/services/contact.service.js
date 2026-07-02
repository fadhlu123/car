import { apiClient } from './apiClient';

export const getConversation = () =>
  apiClient.get('/contact/conversation').then(r => r.data.data);

export const sendMessage = (body) =>
  apiClient.post('/contact/conversation/messages', { body }).then(r => r.data.data);

export const editMessage = (id, body) =>
  apiClient.patch(`/contact/conversation/messages/${id}`, { body }).then(r => r.data.data);

export const markSeen = () =>
  apiClient.post('/contact/conversation/seen').then(r => r.data);
