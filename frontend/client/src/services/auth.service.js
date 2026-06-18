import { apiClient } from './apiClient';

export const register = (email, password, first_name, last_name) =>
  apiClient.post('/auth/register', { email, password, first_name, last_name }).then(r => r.data.data);

export const login = (email, password) =>
  apiClient.post('/auth/login', { email, password }).then(r => r.data.data);

export const logout = () =>
  apiClient.post('/auth/logout').catch(() => {});

export const verifyEmail = (otp) =>
  apiClient.post('/auth/verify-email', { otp }).then(r => r.data);

export const resendVerification = () =>
  apiClient.post('/auth/resend-verification').then(r => r.data);

export const forgotPassword = (email) =>
  apiClient.post('/auth/forgot-password', { email }).then(r => r.data);

export const resetPassword = (email, otp, new_password) =>
  apiClient.post('/auth/reset-password', { email, otp, new_password }).then(r => r.data);

export const changePassword = (current_password, new_password) =>
  apiClient.patch('/auth/change-password', { current_password, new_password }).then(r => r.data);

export const getProfile = () =>
  apiClient.get('/auth/me').then(r => r.data.data);

export const getSessions = () =>
  apiClient.get('/auth/sessions').then(r => r.data.data);

export const revokeSession = (id) =>
  apiClient.delete(`/auth/sessions/${id}`).then(r => r.data);
