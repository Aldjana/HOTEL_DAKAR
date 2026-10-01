const express = require('express');
const router = express.Router();
const paymentModeController = require('../controllers/paymentModeController');
const { auth, authorize } = require('../middleware');

// Admin only for payment mode management, all authenticated users can view
router.post('/', auth, authorize('admin'), paymentModeController.createPaymentMode);
router.get('/', auth, authorize('admin', 'manager', 'reception', 'housekeeping'), paymentModeController.getAllPaymentModes);
router.get('/:id', auth, authorize('admin', 'manager', 'reception', 'housekeeping'), paymentModeController.getPaymentModeById);
router.put('/:id', auth, authorize('admin'), paymentModeController.updatePaymentMode);
router.delete('/:id', auth, authorize('admin'), paymentModeController.deletePaymentMode);

module.exports = router;
