import apiClient, { unwrap, unwrapPage } from './client';

export const authApi = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }).then(unwrap),
  logout: () => apiClient.post('/auth/logout').then(unwrap),
  me: () => apiClient.get('/auth/me').then(unwrap),
  changePassword: (payload) => apiClient.put('/auth/change-password', payload).then(unwrap),
  // Administration des utilisateurs
  listUsers: (params) => apiClient.get('/auth/users', { params }).then(unwrapPage),
  createUser: (data) => apiClient.post('/auth/register', data).then(unwrap),
  updateUser: (id, data) => apiClient.put(`/auth/users/${id}`, data).then(unwrap),
  resetPassword: (id, newPassword) => apiClient.put(`/auth/users/${id}/reset-password`, { new_password: newPassword }).then(unwrap),
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`).then(unwrap),
};
