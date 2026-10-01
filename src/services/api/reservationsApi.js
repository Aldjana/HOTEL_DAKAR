import apiClient, { unwrap, unwrapPage } from './client';

export const reservationsApi = {
  list: (params) => apiClient.get('/reservations', { params }).then(unwrapPage),
  get: (id) => apiClient.get(`/reservations/${id}`).then(unwrap),
  history: (id) => apiClient.get(`/reservations/${id}/history`).then(unwrap),
  create: (data) => apiClient.post('/reservations', data).then(unwrap),
  update: (id, data) => apiClient.put(`/reservations/${id}`, data).then(unwrap),
  changeRoom: (id, data) => apiClient.post(`/reservations/${id}/change-room`, data).then(unwrap),
  checkIn: (id, data = {}) => apiClient.post(`/reservations/${id}/check-in`, data).then(unwrap),
  checkOut: (id, data = {}) => apiClient.post(`/reservations/${id}/check-out`, data).then(unwrap),
  cancel: (id, data = {}) => apiClient.post(`/reservations/${id}/cancel`, data).then(unwrap),
  noShow: (id, data = {}) => apiClient.post(`/reservations/${id}/no-show`, data).then(unwrap),
};
