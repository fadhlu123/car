import apiClient from './apiClient';

/**
 * Fetches all products (public)
 */
export const getProducts = async (params = {}) => {
  const response = await apiClient.get('/products', { params });
  return response.data.data;
};

/**
 * Fetches a single product by ID (public)
 */
export const getProductById = async (id) => {
  const response = await apiClient.get(`/products/${id}`);
  return response.data.data;
};

// --- ADMIN ROUTES ---

/**
 * Creates a new product (admin only)
 */
export const createProduct = async (productData) => {
  const response = await apiClient.post('/admin/products', productData);
  return response.data.data;
};

/**
 * Updates a product (admin only)
 */
export const updateProduct = async (id, productData) => {
  const response = await apiClient.put(`/admin/products/${id}`, productData);
  return response.data.data;
};

/**
 * Deletes a product (admin only)
 */
export const deleteProduct = async (id) => {
  const response = await apiClient.delete(`/admin/products/${id}`);
  return response.data.data;
};
