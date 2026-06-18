import axios from 'axios';
import { ENV } from '../configs/env.config';
import { getAccessToken, getRefreshToken, updateTokens, clearAuth } from '../utils/storage.utils';

export const apiClient = axios.create({ baseURL: ENV.API_BASE_URL });

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status !== 401 || original._retry) return Promise.reject(error);

    if (isRefreshing) {
      return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
        .then((token) => { original.headers.Authorization = `Bearer ${token}`; return apiClient(original); });
    }

    original._retry = true;
    isRefreshing = true;
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      isRefreshing = false;
      clearAuth();
      window.dispatchEvent(new Event('admin:logout'));
      return Promise.reject(error);
    }

    try {
      const { data } = await axios.post(`${ENV.API_BASE_URL}/auth/admin/refresh`, { refresh_token: refreshToken });
      const { access_token, refresh_token } = data.data;
      updateTokens(access_token, refresh_token);
      processQueue(null, access_token);
      original.headers.Authorization = `Bearer ${access_token}`;
      return apiClient(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      clearAuth();
      window.dispatchEvent(new Event('admin:logout'));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default apiClient;
