import apiClient, { unwrap } from './client';

export const settingsApi = {
  publicInfo: () => apiClient.get('/settings/public').then(unwrap),
  getHotel: () => apiClient.get('/settings/hotel').then(unwrap),
  updateHotel: (data) => apiClient.put('/settings/hotel', data).then(unwrap),
  getBilling: () => apiClient.get('/settings/billing').then(unwrap),
  updateBilling: (data) => apiClient.put('/settings/billing', data).then(unwrap),
};
