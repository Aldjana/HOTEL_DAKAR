// Stockage de la session : jetons + utilisateur. Tolérant aux navigateurs qui bloquent le stockage.
// « Se souvenir de moi » décoché → la session vit dans sessionStorage (fermée avec l'onglet).
const K = { token: 'token', refresh: 'refreshToken', user: 'user' };
const FLAG = 'pms_remember';
const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
const store = () => safe(() => (localStorage.getItem(FLAG) === '0' ? sessionStorage : localStorage), localStorage);

export const tokens = {
  getAccess: () => safe(() => store().getItem(K.token)),
  getRefresh: () => safe(() => store().getItem(K.refresh)),
  getUser: () => safe(() => JSON.parse(store().getItem(K.user) || 'null')),
  setRemember: (remember) => safe(() => {
    Object.values(K).forEach((k) => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    localStorage.setItem(FLAG, remember ? '1' : '0');
  }),
  set: ({ token, refreshToken, user }) => safe(() => {
    const s = store();
    if (token) s.setItem(K.token, token);
    if (refreshToken) s.setItem(K.refresh, refreshToken);
    if (user) s.setItem(K.user, JSON.stringify(user));
  }),
  clear: () => safe(() => Object.values(K).forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); })),
};
