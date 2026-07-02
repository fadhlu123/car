import { apiClient } from './apiClient';

export const updateProfile = (data) =>
  apiClient.patch('/user/profile', data).then(r => r.data.data);

export const uploadAvatar = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return apiClient
    .post('/user/profile/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data.data);
};
