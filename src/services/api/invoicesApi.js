import apiClient, { unwrap, unwrapPage } from './client';

export const invoicesApi = {
  list: (params) => apiClient.get('/invoices', { params }).then(unwrapPage),
  get: (id) => apiClient.get(`/invoices/${id}`).then(unwrap),
  createForReservation: (reservationId, data = {}) => apiClient.post(`/invoices/reservation/${reservationId}`, data).then(unwrap),
  update: (id, data) => apiClient.put(`/invoices/${id}`, data).then(unwrap),
  markSent: (id) => apiClient.post(`/invoices/${id}/mark-sent`).then(unwrap),
  markPaid: (id, data) => apiClient.patch(`/invoices/${id}/mark-paid`, data).then(unwrap),
  remove: (id) => apiClient.delete(`/invoices/${id}`).then(unwrap),
  documents: (params) => apiClient.get('/documents', { params }).then(unwrapPage),
};
