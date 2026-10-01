const { body } = require('express-validator');

const dateOpt = (f, label) => body(f).optional({ nullable: true }).isISO8601().withMessage(`${label} invalide`);

const shared = [
  body('adults_count').optional().isInt({ min: 1 }).withMessage("Le nombre d'adultes doit être au moins 1"),
  body('children_count').optional().isInt({ min: 0 }).withMessage("Le nombre d'enfants doit être 0 ou plus"),
  body('discount_amount').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Remise invalide'),
  body('discount_percent').optional({ nullable: true }).isFloat({ min: 0, max: 100 }).withMessage('Pourcentage de remise invalide'),
  body('special_requests').optional({ nullable: true }).trim().isLength({ max: 1000 }).withMessage('Les demandes spéciales ne doivent pas dépasser 1000 caractères'),
  body('notes').optional({ nullable: true }).trim().isLength({ max: 2000 }).withMessage('Notes trop longues'),
  body('guests').optional().isArray().withMessage('Liste des personnes invalide'),
];

const createReservationValidation = [
  body('client_id').notEmpty().withMessage("Le client est requis").isMongoId().withMessage('Client invalide'),
  body('room_id').if((v, { req }) => !req.body.rooms && !req.body.room_ids).notEmpty().withMessage('La chambre est requise').isMongoId().withMessage('Chambre invalide'),
  body('arrival_date').notEmpty().withMessage("La date d'arrivée est requise").isISO8601().withMessage("Date d'arrivée invalide"),
  body('departure_date').notEmpty().withMessage('La date de départ est requise').isISO8601().withMessage('Date de départ invalide')
    .custom((value, { req }) => {
      if (String(value).slice(0, 10) <= String(req.body.arrival_date).slice(0, 10)) throw new Error("La date de départ doit être après la date d'arrivée");
      return true;
    }),
  body('status').optional().isIn(['pending', 'confirmed']).withMessage('Statut initial invalide (option ou confirmée)'),
  ...shared,
];

const updateReservationValidation = [
  dateOpt('arrival_date', "Date d'arrivée"),
  dateOpt('departure_date', 'Date de départ'),
  body('client_id').optional().isMongoId().withMessage('Client invalide'),
  body('room_id').optional().isMongoId().withMessage('Chambre invalide'),
  body('status').optional().isIn(['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show']).withMessage('Statut invalide'),
  ...shared,
];

const checkInValidation = [body('check_in_time').optional().isISO8601().withMessage("Heure de check-in invalide")];
const checkOutValidation = [body('check_out_time').optional().isISO8601().withMessage('Heure de check-out invalide')];

module.exports = { createReservationValidation, updateReservationValidation, checkInValidation, checkOutValidation };
