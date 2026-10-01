const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  const operational = err.isOperational === true;
  if (!operational) {
    logger.error('Error:', { message: err.message, stack: err.stack, url: req.url, method: req.method });
  }

  const send = (status, body) => res.status(status).json({ success: false, ...body });

  if (err.name === 'ValidationError' && err.errors && !err.isOperational) {
    return send(400, {
      message: 'Erreur de validation',
      errors: Object.keys(err.errors).map((key) => ({ field: key, message: err.errors[key].message })),
    });
  }
  if (err.name === 'CastError') return send(400, { message: 'Identifiant invalide', field: err.path });
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0];
    return send(409, { message: field ? `Valeur déjà utilisée pour « ${field} »` : 'Entrée en double', field });
  }
  if (err.name === 'TokenExpiredError') return send(401, { message: 'Token expiré', code: 'TOKEN_EXPIRED' });
  if (err.name === 'JsonWebTokenError') return send(401, { message: 'Token invalide', code: 'TOKEN_INVALID' });
  if (err.type === 'entity.parse.failed') return send(400, { message: 'JSON invalide' });

  const status = err.statusCode || err.status || 500;
  return send(status, {
    message: status >= 500 && !operational ? 'Erreur interne du serveur' : err.message,
    ...(err.code && operational && { code: err.code }),
    ...(err.errors && { errors: err.errors }),
    ...(process.env.NODE_ENV === 'development' && !operational && { stack: err.stack }),
  });
};

const notFound = (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} non trouvée` });
};

module.exports = { errorHandler, notFound };
