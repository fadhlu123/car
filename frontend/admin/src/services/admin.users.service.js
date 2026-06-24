import { apiClient } from './apiClient';

export const getUsers = (params = {}) =>
  apiClient.get('/admin/users', { params }).then(r => r.data.data);

export const getUserDetail = (id) =>
  apiClient.get(`/admin/users/${id}`).then(r => r.data.data);

export const unlockUser = (id) =>
  apiClient.patch(`/admin/users/${id}/unlock`);

export const deactivateUser = (id) =>
  apiClient.patch(`/admin/users/${id}/deactivate`);

export const activateUser = (id) =>
  apiClient.patch(`/admin/users/${id}/activate`);
