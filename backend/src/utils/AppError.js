class AppError extends Error {
  constructor(message, statusCode = 500, code = null, errors = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace?.(this, this.constructor);
  }

  static badRequest(msg = 'Requête invalide', errors) { return new AppError(msg, 400, 'BAD_REQUEST', errors); }
  static unauthorized(msg = 'Authentification requise', code = 'UNAUTHORIZED') { return new AppError(msg, 401, code); }
  static forbidden(msg = 'Permissions insuffisantes') { return new AppError(msg, 403, 'FORBIDDEN'); }
  static notFound(msg = 'Ressource non trouvée') { return new AppError(msg, 404, 'NOT_FOUND'); }
  static conflict(msg = 'Conflit', code = 'CONFLICT') { return new AppError(msg, 409, code); }
}

module.exports = AppError;
