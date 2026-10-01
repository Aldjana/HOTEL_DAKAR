const { body } = require('express-validator');

const extra = [
  body('client_type').optional({ checkFalsy: true }).isIn(['individual', 'company', 'agency', 'ngo', 'diaspora', 'tourist', 'local', 'other']).withMessage('Type de client invalide'),
  body('company').optional({ nullable: true }).trim().isLength({ max: 120 }).withMessage('Nom de société trop long'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Notes trop longues'),
];

const createClientValidation = [
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
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Veuillez fournir un email valide'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Le numéro de téléphone ne doit pas dépasser 30 caractères'),
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La nationalité ne doit pas dépasser 100 caractères'),
  body('id_document_type')
    .optional({ checkFalsy: true })
    .isIn(['passport', 'id_card', 'driver_license', 'other'])
    .withMessage('Type de document invalide'),
  body('id_document_number')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Le numéro de document ne doit pas dépasser 50 caractères'),
  body('is_vip')
    .optional()
    .isBoolean()
    .withMessage('Le statut VIP doit être un booléen'),
  ...extra,
];

const updateClientValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('email')
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage('Veuillez fournir un email valide'),
  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 })
    .withMessage('Le numéro de téléphone ne doit pas dépasser 30 caractères'),
  body('nationality')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('La nationalité ne doit pas dépasser 100 caractères'),
  body('is_vip')
    .optional()
    .isBoolean()
    .withMessage('Le statut VIP doit être un booléen'),
  ...extra,
];

module.exports = {
  createClientValidation,
  updateClientValidation,
};
