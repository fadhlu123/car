import { apiClient } from './apiClient';

export const listBlocks = () =>
  apiClient.get('/admin/content/about/blocks').then(r => r.data.data);

export const addBlock = (data, file) => {
  const form = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) form.append(key, value);
  });
  if (file) form.append('file', file);
  return apiClient
    .post('/admin/content/about/blocks', form, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(r => r.data.data);
};

export const updateBlock = (id, data) =>
  apiClient.patch(`/admin/content/about/blocks/${id}`, data).then(r => r.data.data);

export const reorderBlocks = (items) =>
  apiClient.patch('/admin/content/about/reorder', items).then(r => r.data.data);

export const deleteBlock = (id) =>
  apiClient.delete(`/admin/content/about/blocks/${id}`);

export const getContactInfo = () =>
  apiClient.get('/content/contact-info').then(r => r.data.data);

export const updateContactInfo = (data) =>
  apiClient.put('/admin/content/contact-info', data).then(r => r.data.data);
