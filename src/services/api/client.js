import { tr } from '../../i18n';
import axios from 'axios';
import { API_CONFIG } from '../../constants/app';
import { tokens } from '../storage/authTokens';

const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Événement émis quand la session est définitivement perdue (refresh impossible) :
// l'AuthContext l'écoute et redirige proprement sans rechargement de page.
export const AUTH_LOST_EVENT = 'auth:session-lost';

const isAuthEndpoint = (url = '') => /\/auth\/(login|refresh-token)/.test(url);

apiClient.interceptors.request.use((config) => {
  const token = tokens.getAccess();
  if (token && !isAuthEndpoint(config.url)) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Un seul rafraîchissement à la fois : les requêtes concurrentes attendent la même promesse.
let refreshPromise = null;
const refreshSession = () => {
  if (!refreshPromise) {
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) return Promise.reject(new Error('NO_REFRESH_TOKEN'));
    refreshPromise = axios
      .post(`${API_CONFIG.BASE_URL}/auth/refresh-token`, { refresh_token: refreshToken }, { timeout: API_CONFIG.TIMEOUT })
      .then((res) => {
        const d = res.data?.data || {};
        if (!d.token) throw new Error('REFRESH_BAD_RESPONSE');
        tokens.set({ token: d.token, refreshToken: d.refreshToken, user: d.user });
        return d.token;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true;
      try {
        const newToken = await refreshSession();
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      } catch (refreshError) {
        // Seule une réponse explicite du serveur (401/403) met fin à la session ;
        // une panne réseau ne doit jamais déconnecter l'utilisateur.
        const s = refreshError.response?.status;
        if (refreshError.message === 'NO_REFRESH_TOKEN' || s === 401 || s === 403) {
          tokens.clear();
          window.dispatchEvent(new CustomEvent(AUTH_LOST_EVENT, { detail: refreshError.response?.data?.message }));
        }
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// Message d'erreur lisible pour l'utilisateur
export const getErrorMessage = (error, fallback = 'Une erreur est survenue') => tr(rawErrorMessage(error, fallback));
const rawErrorMessage = (error, fallback) => {
  if (error?.response) {
    const d = error.response.data;
    if (d?.errors?.length && d.errors[0]?.message && error.response.status === 400) return d.errors.map((e) => e.message).join(' · ');
    return d?.message || fallback;
  }
  if (error?.code === 'ECONNABORTED') return 'Le serveur met trop de temps à répondre';
  if (error?.request) return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  return error?.message || fallback;
};
export const getErrorCode = (error) => error?.response?.data?.code;

// Extrait { data, pagination } d'une réponse API
export const unwrap = (res) => res.data?.data;
export const unwrapPage = (res) => ({ items: res.data?.data || [], pagination: res.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 } });

export default apiClient;
