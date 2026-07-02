import { apiClient } from './apiClient';

export const adminRegister = (first_name, last_name, email, password, registration_key) =>
  apiClient.post('/auth/admin/register', { first_name, last_name, email, password, registration_key }).then(r => r.data.data);

export const adminLogin = (email, password) =>
  apiClient.post('/auth/admin/login', { email, password }).then(r => r.data.data);

export const adminLogout = () =>
  apiClient.post('/auth/admin/logout').catch(() => {});

export const getAdminProfile = () =>
  apiClient.get('/auth/admin/me').then(r => r.data.data);

export const getAdminSessions = () =>
  apiClient.get('/auth/admin/sessions').then(r => r.data.data);

export const changeAdminPassword = (current_password, new_password) =>
  apiClient.patch('/auth/admin/change-password', { current_password, new_password });

export const getAuditLogs = (params = {}) =>
  apiClient.get('/auth/admin/audit-logs', { params }).then(r => r.data.data);

export const updateAdminProfile = (data) =>
  apiClient.patch('/admin/profile', data).then(r => r.data.data);

export const uploadAdminAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return apiClient
    .post('/admin/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data.data);
};
