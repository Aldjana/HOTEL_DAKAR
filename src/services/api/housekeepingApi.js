import apiClient, { unwrap, unwrapPage } from './client';

export const housekeepingApi = {
  list: (params) => apiClient.get('/housekeeping', { params }).then(unwrapPage),
  statistics: () => apiClient.get('/housekeeping/statistics').then(unwrap),
  staff: () => apiClient.get('/housekeeping/staff').then(unwrap),
  create: (data) => apiClient.post('/housekeeping', data).then(unwrap),
  update: (id, data) => apiClient.put(`/housekeeping/${id}`, data).then(unwrap),
  start: (id) => apiClient.post(`/housekeeping/${id}/start`).then(unwrap),
  complete: (id) => apiClient.post(`/housekeeping/${id}/complete`).then(unwrap),
  assign: (id, assigned_to) => apiClient.post(`/housekeeping/${id}/assign`, { assigned_to }).then(unwrap),
  remove: (id) => apiClient.delete(`/housekeeping/${id}`).then(unwrap),
};
