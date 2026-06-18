import { apiClient } from './apiClient';

export const submitOrder = (orderData) =>
  apiClient.post('/orders', orderData).then(r => r.data.data);
