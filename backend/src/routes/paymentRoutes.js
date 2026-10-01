const express = require('express');
const router = express.Router();
const c = require('../controllers/paymentController');
const { auth, requirePermission } = require('../middleware');
const v = require('../validators').payment;

const read = [auth, requirePermission('payments.read')];

router.post('/', auth, requirePermission('payments.create'), v.createPaymentValidation, c.createPayment);
router.get('/', ...read, c.getAllPayments);
router.get('/methods', auth, c.getMethods);
router.get('/by-date-range', ...read, c.getPaymentsByDateRange);
router.get('/by-reservation', ...read, c.getPaymentsByReservation);
router.get('/reservation/:reservationId', ...read, c.getPaymentsByReservation);
router.get('/summary', ...read, c.getPaymentSummary);
router.get('/:id', ...read, c.getPaymentById);
router.get('/:id/receipt', ...read, c.getReceiptPdf);
// Correction / annulation / remboursement : administrateur et manager uniquement (CDC)
router.put('/:id', auth, requirePermission('payments.correct'), v.updatePaymentValidation, c.updatePayment);
router.delete('/:id', auth, requirePermission('payments.delete'), c.voidPayment);
router.post('/:id/refund', auth, requirePermission('payments.correct'), c.refundPayment);

module.exports = router;
