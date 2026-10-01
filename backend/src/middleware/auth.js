const jwt = require('jsonwebtoken');
const config = require('../config');
const { can } = require('../config/permissions');
const AppError = require('../utils/AppError');

const extractToken = (req) => {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.substring(7).trim() : null;
};

const loadUser = async (decoded) => {
  const { User } = require('../models');
  const user = await User.findById(decoded.id).select('-password_hash');
  if (!user) throw AppError.unauthorized('Utilisateur introuvable', 'USER_NOT_FOUND');
  if (!user.is_active) throw AppError.unauthorized('Compte désactivé', 'USER_INACTIVE');
  if ((decoded.tv || 0) !== (user.token_version || 0)) throw AppError.unauthorized('Session révoquée', 'TOKEN_REVOKED');
  return user;
};

const auth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (!token) throw AppError.unauthorized("Token d'accès requis", 'TOKEN_MISSING');
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (e) {
      if (e.name === 'TokenExpiredError') throw AppError.unauthorized('Token expiré', 'TOKEN_EXPIRED');
      throw AppError.unauthorized('Token invalide', 'TOKEN_INVALID');
    }
    const user = await loadUser(decoded);
    // Le rôle vient toujours de la base : un changement de rôle est effectif immédiatement.
    req.user = {
      id: user._id.toString(),
      _id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
    };
    next();
  } catch (err) {
    next(err);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    if (token) {
      try {
        const decoded = jwt.verify(token, config.jwt.secret);
        const user = await loadUser(decoded);
        req.user = { id: user._id.toString(), _id: user._id, email: user.email, role: user.role };
      } catch (e) { /* ignoré */ }
    }
    next();
  } catch (err) {
    next(err);
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) return next(AppError.forbidden());
  next();
};

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) return next(AppError.unauthorized());
  if (!can(req.user.role, permission)) {
    return next(AppError.forbidden("Vous n'avez pas la permission d'effectuer cette action"));
  }
  next();
};

module.exports = { auth, optionalAuth, authorize, requirePermission };
