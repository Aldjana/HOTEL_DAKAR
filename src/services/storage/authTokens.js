// Stockage de la session : jeton d'accès (courte durée) + utilisateur. Tolérant aux navigateurs qui bloquent le stockage.
// Le jeton de renouvellement n'est PAS stocké ici : le serveur le place dans un cookie httpOnly.
// « Se souvenir de moi » décoché → la session vit dans sessionStorage (fermée avec l'onglet).
const K = { token: 'token', refresh: 'refreshToken', user: 'user' };
const FLAG = 'pms_remember';
const safe = (fn, fallback = null) => { try { return fn(); } catch { return fallback; } };
const store = () => safe(() => (localStorage.getItem(FLAG) === '0' ? sessionStorage : localStorage), localStorage);

export const tokens = {
  getAccess: () => safe(() => store().getItem(K.token)),
  // Ancien jeton de renouvellement (sessions ouvertes avant le cookie httpOnly) : lu une fois pour migrer.
  getLegacyRefresh: () => safe(() => store().getItem(K.refresh)),
  clearLegacyRefresh: () => safe(() => { localStorage.removeItem(K.refresh); sessionStorage.removeItem(K.refresh); }),
  getRemember: () => safe(() => localStorage.getItem(FLAG) !== '0', true),
  getUser: () => safe(() => JSON.parse(store().getItem(K.user) || 'null')),
  setRemember: (remember) => safe(() => {
    Object.values(K).forEach((k) => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    localStorage.setItem(FLAG, remember ? '1' : '0');
  }),
  set: ({ token, user }) => safe(() => {
    const s = store();
    if (token) s.setItem(K.token, token);
    if (user) s.setItem(K.user, JSON.stringify(user));
  }),
  clear: () => safe(() => Object.values(K).forEach((k) => { localStorage.removeItem(k); sessionStorage.removeItem(k); })),
};
