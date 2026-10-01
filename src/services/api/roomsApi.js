import apiClient, { unwrap, unwrapPage } from './client';

export const roomsApi = {
  list: (params) => apiClient.get('/rooms', { params }).then(unwrapPage),
  get: (id) => apiClient.get(`/rooms/${id}`).then(unwrap),
  available: (params) => apiClient.get('/rooms/available', { params }).then(unwrap),
  statistics: () => apiClient.get('/rooms/statistics').then(unwrap),
  create: (data) => apiClient.post('/rooms', data).then(unwrap),
  update: (id, data) => apiClient.put(`/rooms/${id}`, data).then(unwrap),
  setStatus: (id, status) => apiClient.patch(`/rooms/${id}/status`, { status }).then(unwrap),
  setActive: (id, is_active) => apiClient.patch(`/rooms/${id}/active`, { is_active }).then(unwrap),
  remove: (id) => apiClient.delete(`/rooms/${id}`).then(unwrap),
};

const crud = (base) => ({
  list: (params) => apiClient.get(base, { params: { limit: 200, ...params } }).then(unwrapPage).then((r) => r.items),
  create: (data) => apiClient.post(base, data).then(unwrap),
  update: (id, data) => apiClient.put(`${base}/${id}`, data).then(unwrap),
  remove: (id) => apiClient.delete(`${base}/${id}`).then(unwrap),
});

export const roomTypesApi = crud('/room-types');
export const paymentModesApi = crud('/payment-modes');
export const reservationSourcesApi = crud('/reservation-sources');
