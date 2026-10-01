import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api/authApi';
import { AUTH_LOST_EVENT } from '../services/api/client';
import { tokens } from '../services/storage/authTokens';
import { can as canRole } from '../utils/permissions';
import { tr } from '../i18n';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => tokens.getUser());
  // Tant qu'un token existe, on valide la session auprès du serveur avant d'afficher quoi que ce soit.
  const [loading, setLoading] = useState(() => !!tokens.getAccess());
  const [sessionMessage, setSessionMessage] = useState('');

  const clearSession = useCallback((message = '') => {
    tokens.clear();
    setUser(null);
    setSessionMessage(message);
  }, []);

  // Validation de session au démarrage (GET /auth/me ; l'intercepteur rafraîchit le jeton si besoin)
  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!tokens.getAccess()) { setLoading(false); return; }
      try {
        const me = await authApi.me();
        if (cancelled) return;
        tokens.set({ user: me });
        setUser(me);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        // 401/403 : session invalide. Panne réseau : on garde la session locale pour ne pas déconnecter à tort.
        if (status === 401 || status === 403) clearSession(tr('Votre session a expiré. Veuillez vous reconnecter.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    boot();
    return () => { cancelled = true; };
  }, [clearSession]);

  // Session perdue pendant l'utilisation (refresh refusé par le serveur)
  useEffect(() => {
    const onLost = (e) => clearSession(e.detail || tr('Votre session a expiré. Veuillez vous reconnecter.'));
    window.addEventListener(AUTH_LOST_EVENT, onLost);
    return () => window.removeEventListener(AUTH_LOST_EVENT, onLost);
  }, [clearSession]);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password);
    tokens.set({ token: data.token, refreshToken: data.refreshToken, user: data.user });
    setSessionMessage('');
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch { /* déjà expiré : on nettoie quand même */ }
    clearSession('');
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: !!user,
    sessionMessage,
    login,
    logout,
    can: (permission) => !!user && canRole(user.role, permission),
    hasRole: (...roles) => !!user && roles.includes(user.role),
    updateUser: (patch) => setUser((u) => { const next = { ...u, ...patch }; tokens.set({ user: next }); return next; }),
  }), [user, loading, sessionMessage, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
};
