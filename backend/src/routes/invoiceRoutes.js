const express = require('express');
const router = express.Router();
const c = require('../controllers/invoiceController');
const { auth, requirePermission } = require('../middleware');

const read = [auth, requirePermission('invoices.read')];
const write = [auth, requirePermission('invoices.write')];

// Routes spécifiques avant /:id
router.get('/by-date-range', ...read, c.getInvoicesByDateRange);
router.get('/reservation/:reservationId', ...read, c.getInvoicesByReservation);
router.post('/reservation/:reservationId', ...write, c.createFromReservation);
router.get('/client/:clientId', ...read, c.getInvoicesByClient);
router.post('/', ...write, c.createInvoice);
router.get('/', ...read, c.getAllInvoices);
router.get('/:id', ...read, c.getInvoiceById);
router.get('/:id/pdf', ...read, c.generateInvoicePdf);
router.put('/:id', ...write, c.updateInvoice);
router.post('/:id/mark-sent', ...write, c.markSent);
router.patch('/:id/mark-paid', ...write, c.markPaid);
router.delete('/:id', auth, requirePermission('payments.delete'), c.deleteInvoice);

module.exports = router;
