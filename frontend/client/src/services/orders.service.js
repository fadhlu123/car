import { apiClient } from './apiClient';

export const submitOrder = (orderData) =>
  apiClient.post('/orders', orderData).then(r => r.data.data);

export const getMyOrders = (params = {}) =>
  apiClient.get('/orders/mine', { params }).then(r => r.data.data);
