import apiClient, { unwrap, unwrapPage } from './client';
import { tokens } from '../storage/authTokens';

export const authApi = {
  // use_cookie : le serveur place le jeton de renouvellement dans un cookie httpOnly (jamais dans la réponse)
  login: (email, password, remember = true) => apiClient.post('/auth/login', { email, password, remember, use_cookie: true }).then(unwrap),
  logout: () => apiClient.post('/auth/logout').then(unwrap),
  me: () => apiClient.get('/auth/me').then(unwrap),
  changePassword: (payload) => apiClient.put('/auth/change-password', { ...payload, use_cookie: true, remember: tokens.getRemember() }).then(unwrap),
  // Administration des utilisateurs
  listUsers: (params) => apiClient.get('/auth/users', { params }).then(unwrapPage),
  createUser: (data) => apiClient.post('/auth/register', data).then(unwrap),
  updateUser: (id, data) => apiClient.put(`/auth/users/${id}`, data).then(unwrap),
  resetPassword: (id, newPassword) => apiClient.put(`/auth/users/${id}/reset-password`, { new_password: newPassword }).then(unwrap),
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`).then(unwrap),
};
