const jwt = require('jsonwebtoken');
const config = require('../config');

// Jeton de renouvellement dans un cookie httpOnly : illisible par le JavaScript de la page (protection XSS).
// SameSite=Strict : jamais envoyé depuis un autre site (protection CSRF). Limité aux routes /auth.
const NAME = 'refresh_token';
const options = () => ({
  httpOnly: true,
  secure: config.app.env === 'production',
  sameSite: 'strict',
  path: `${config.app.apiPrefix}/auth`,
});

const read = (req) => {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === NAME) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return null;
};

// persistent = « Se souvenir de moi » : le cookie survit à la fermeture du navigateur jusqu'à l'expiration du jeton.
const set = (res, token, persistent) => {
  const exp = jwt.decode(token)?.exp;
  res.cookie(NAME, token, { ...options(), ...(persistent && exp ? { maxAge: exp * 1000 - Date.now() } : {}) });
};

const clear = (res) => res.clearCookie(NAME, options());

module.exports = { read, set, clear, NAME };
