const response = {
  success: (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  },

  error: (res, message = 'Error', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  },

  created: (res, data, message = 'Resource created successfully') => {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  },

  badRequest: (res, message = 'Requête invalide', errors = null) => response.error(res, message, 400, errors),
  unauthorized: (res, message = 'Authentification requise') => response.error(res, message, 401),
  forbidden: (res, message = 'Permissions insuffisantes') => response.error(res, message, 403),
  notFound: (res, message = 'Ressource non trouvée') => response.error(res, message, 404),

  noContent: (res) => {
    return res.status(204).send();
  },

  paginated: (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    });
  },
};

module.exports = response;
