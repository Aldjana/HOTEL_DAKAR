const { auth, optionalAuth, authorize, requirePermission } = require('./auth');
const { errorHandler, notFound } = require('./errorHandler');
const { rateLimiter, authRateLimiter, loginAccountLimiter } = require('./rateLimiter');
const validate = require('./validate');

module.exports = {
  auth,
  optionalAuth,
  authorize,
  requirePermission,
  errorHandler,
  notFound,
  rateLimiter,
  authRateLimiter,
  loginAccountLimiter,
  validate,
};
