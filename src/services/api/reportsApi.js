import apiClient, { unwrap, unwrapPage } from './client';

export const reportsApi = {
  planning: (params) => apiClient.get('/reports/planning', { params }).then(unwrap),
  overview: (params) => apiClient.get('/reports/overview', { params }).then(unwrap),
  occupancy: (params) => apiClient.get('/reports/occupancy', { params }).then(unwrap),
  receivables: () => apiClient.get('/reports/receivables').then(unwrap),
  usage: (params) => apiClient.get('/reports/usage', { params }).then(unwrap),
  auditLogs: (params) => apiClient.get('/history-logs', { params }).then(unwrapPage),
};
