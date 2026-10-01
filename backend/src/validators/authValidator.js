const { body } = require('express-validator');

const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Le mot de passe doit comporter au moins 8 caractères'),
  body('first_name')
    .trim()
    .notEmpty()
    .withMessage('Le prénom est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .trim()
    .notEmpty()
    .withMessage('Le nom est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('role')
    .optional()
    .isIn(['admin', 'reception', 'housekeeping', 'manager'])
    .withMessage('Rôle invalide'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Veuillez fournir un email valide'),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
];

const refreshTokenValidation = [
  body('refresh_token').custom((v, { req }) => {
    if (!v && !req.body.refreshToken) throw new Error('Le token de rafraîchissement est requis');
    return true;
  }),
];

const changePasswordValidation = [
  body('current_password').notEmpty().withMessage('Le mot de passe actuel est requis'),
  body('new_password').isLength({ min: 8 }).withMessage('Le nouveau mot de passe doit comporter au moins 8 caractères'),
];

const resetPasswordValidation = [
  body('new_password').isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères'),
];

const updateUserValidation = [
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('first_name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Prénom : 2 à 50 caractères'),
  body('last_name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Nom : 2 à 50 caractères'),
  body('role').optional().isIn(['admin', 'reception', 'housekeeping', 'manager']).withMessage('Rôle invalide'),
  body('is_active').optional().isBoolean().withMessage('Statut invalide'),
  body('password').optional().isLength({ min: 8 }).withMessage('Le mot de passe doit comporter au moins 8 caractères'),
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  resetPasswordValidation,
  updateUserValidation,
};
