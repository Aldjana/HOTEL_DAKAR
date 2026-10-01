import apiClient, { unwrap } from './client';

export const dashboardApi = {
  statistics: () => apiClient.get('/dashboard/statistics').then(unwrap),
};
