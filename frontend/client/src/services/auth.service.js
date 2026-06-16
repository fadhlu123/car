import apiClient from './apiClient';

/**
 * Logs in the admin user
 * @param {string} email
 * @param {string} password
 * @returns Promise resolving to the user object with token
 */
export const login = async (email, password) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data.data; // Assumes backend returns { success: true, data: { ...userInfo, token } }
};

/**
 * Gets the current logged-in profile
 */
export const getProfile = async () => {
  const response = await apiClient.get('/auth/profile');
  return response.data.data;
};
