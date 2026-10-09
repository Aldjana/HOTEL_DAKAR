const rateLimit = require('express-rate-limit');
const config = require('../config');

const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Trop de requêtes, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS' || req.path === '/health',
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  message: {
    success: false,
    message: 'Trop de tentatives d\'authentification, veuillez réessayer plus tard.',
  },
});

// Connexion : en plus de la limite par IP, une limite par compte (email) contre les essais de mots de passe
// répartis sur plusieurs adresses IP.
const loginAccountLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.LOGIN_ACCOUNT_RATE_LIMIT_MAX) || 10,
  keyGenerator: (req) => `login:${String(req.body?.email || '').trim().toLowerCase()}`,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Trop de tentatives de connexion pour ce compte, veuillez réessayer dans 15 minutes.',
  },
});

module.exports = { rateLimiter, authRateLimiter, loginAccountLimiter };
