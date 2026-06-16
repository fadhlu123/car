import apiClient from './apiClient';

/**
 * Submits a new order from the frontend (public)
 * @param {Object} orderData { items: [...], contact: { name, email, phone, notes } }
 */
export const submitOrder = async (orderData) => {
  const response = await apiClient.post('/orders', orderData);
  return response.data.data;
};

// --- ADMIN ROUTES ---

/**
 * Fetches all orders (admin only)
 */
export const getOrders = async () => {
  const response = await apiClient.get('/admin/orders');
  return response.data.data;
};

/**
 * Fetches a single order by ID (admin only)
 */
export const getOrderById = async (id) => {
  const response = await apiClient.get(`/admin/orders/${id}`);
  return response.data.data;
};

/**
 * Updates an order status (admin only)
 */
export const updateOrderStatus = async (id, status) => {
  const response = await apiClient.put(`/admin/orders/${id}`, { status });
  return response.data.data;
};
