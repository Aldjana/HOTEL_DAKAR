const { body } = require('express-validator');

const createPaymentValidation = [
  body('reservation_id').notEmpty().withMessage('La réservation est requise').isMongoId().withMessage('Réservation invalide'),
  body('amount').notEmpty().withMessage('Le montant est requis').isFloat({ min: 1 }).withMessage('Le montant doit être supérieur à 0'),
  body('payment_method').notEmpty().withMessage('Le mode de paiement est requis'),
  body('payment_date').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Date de paiement invalide'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description trop longue (500 max)'),
  body('reference').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Référence trop longue (100 max)'),
];

const updatePaymentValidation = [
  body('amount').optional().isFloat({ min: 1 }).withMessage('Le montant doit être supérieur à 0'),
  body('reason').notEmpty().withMessage('Un motif de correction est requis'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 500 }).withMessage('Description trop longue'),
];

module.exports = { createPaymentValidation, updatePaymentValidation };
