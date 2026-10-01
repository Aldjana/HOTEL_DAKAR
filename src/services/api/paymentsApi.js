import apiClient, { unwrap, unwrapPage } from './client';

export const paymentsApi = {
  list: (params) => apiClient.get('/payments', { params }).then(unwrapPage),
  get: (id) => apiClient.get(`/payments/${id}`).then(unwrap),
  methods: () => apiClient.get('/payments/methods').then(unwrap),
  summary: (params) => apiClient.get('/payments/summary', { params }).then(unwrap),
  create: (data) => apiClient.post('/payments', data).then(unwrap),
  correct: (id, data) => apiClient.put(`/payments/${id}`, data).then(unwrap),
  void: (id, reason) => apiClient.delete(`/payments/${id}`, { data: { reason } }).then(unwrap),
  refund: (id, data) => apiClient.post(`/payments/${id}/refund`, data).then(unwrap),
};
