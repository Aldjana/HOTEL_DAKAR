const express = require('express');
const router = express.Router();
const c = require('../controllers/documentController');
const { auth, requirePermission } = require('../middleware');

const read = [auth, requirePermission('invoices.read')];
router.get('/', ...read, c.getAllDocuments);
router.get('/reservation/:reservationId', ...read, c.getDocumentsByReservation);
router.get('/:id', ...read, c.getDocumentById);
router.get('/:id/download', ...read, c.downloadDocument);
router.delete('/:id', auth, requirePermission('payments.delete'), c.deleteDocument);

module.exports = router;
