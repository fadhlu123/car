import { apiClient } from './apiClient';

export const getOrders = (params = {}) =>
  apiClient.get('/admin/orders', { params }).then(r => r.data.data);

export const getOrderById = (id) =>
  apiClient.get(`/admin/orders/${id}`).then(r => r.data.data);

export const updateOrderStatus = (id, status) =>
  apiClient.patch(`/admin/orders/${id}/status`, { status }).then(r => r.data.data);
