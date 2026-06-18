import { apiClient } from './apiClient';

export const getProducts = (params = {}) =>
  apiClient.get('/admin/products', { params }).then(r => r.data.data);

export const getProductById = (id) =>
  apiClient.get(`/admin/products/${id}`).then(r => r.data.data);

export const createProduct = (formData) =>
  apiClient.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data);

export const updateProduct = (id, data) =>
  apiClient.patch(`/admin/products/${id}`, data).then(r => r.data.data);

export const addProductImages = (id, files) => {
  const fd = new FormData();
  files.forEach((f) => fd.append('images', f));
  return apiClient.post(`/admin/products/${id}/images`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data.data);
};

export const deleteProduct = (id) =>
  apiClient.delete(`/admin/products/${id}`).then(r => r.data);
