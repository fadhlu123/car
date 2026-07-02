import { apiClient } from './apiClient';

export const getAbout = () =>
  apiClient.get('/content/about').then(r => r.data.data);

export const getContactInfo = () =>
  apiClient.get('/content/contact-info').then(r => r.data.data);
