import { apiClient } from './apiClient';

export const adminLogin = (email, password) =>
  apiClient.post('/auth/admin/login', { email, password }).then(r => r.data.data);

export const adminLogout = () =>
  apiClient.post('/auth/admin/logout').catch(() => {});

export const getAdminProfile = () =>
  apiClient.get('/auth/admin/me').then(r => r.data.data);
