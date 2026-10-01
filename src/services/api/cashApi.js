import apiClient, { unwrap } from './client';

export const cashApi = {
  daily: (params) => apiClient.get('/cash/daily', { params }).then(unwrap),
  cashiers: () => apiClient.get('/cash/cashiers').then(unwrap),
  closures: (params) => apiClient.get('/cash/closures', { params }).then(unwrap),
  close: (data) => apiClient.post('/cash/close', data).then(unwrap),
  reopen: (date) => apiClient.delete(`/cash/closures/${date}`).then(unwrap),
};
