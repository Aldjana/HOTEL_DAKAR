import apiClient, { unwrap, unwrapPage } from './client';

export const clientsApi = {
  list: (params) => apiClient.get('/clients', { params }).then(unwrapPage),
  search: (q) => apiClient.get('/clients/search', { params: { q } }).then(unwrap),
  get: (id) => apiClient.get(`/clients/${id}`).then(unwrap),
  history: (id) => apiClient.get(`/clients/${id}/history`).then(unwrap),
  create: (data) => apiClient.post('/clients', data).then(unwrap),
  update: (id, data) => apiClient.put(`/clients/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/clients/${id}`).then(unwrap),
};
