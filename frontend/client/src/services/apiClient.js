import axios from 'axios';
import { ENV } from '../configs/env.config';
import { getStoredUserInfo } from '../utils/storage.utils';

const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
});

// Add a request interceptor to inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    const userInfo = getStoredUserInfo();
    if (userInfo && userInfo.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Optional: Add response interceptor to handle global 401s (e.g. log user out if token expires)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we receive a 401 Unauthorized, we could trigger a logout action here
    if (error.response && error.response.status === 401) {
      // e.g., clearStoredUserInfo(); window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
