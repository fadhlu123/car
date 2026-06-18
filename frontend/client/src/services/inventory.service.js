import { apiClient } from './apiClient';

export const getProducts = (params = {}) =>
  apiClient.get('/products', { params }).then(r => r.data.data);

export const getProductById = (id) =>
  apiClient.get(`/products/${id}`).then(r => r.data.data);
