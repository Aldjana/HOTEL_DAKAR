const express = require('express');
const router = express.Router();
const reservationSourceController = require('../controllers/reservationSourceController');
const { auth, authorize } = require('../middleware');

// Admin only for reservation source management, all authenticated users can view
router.post('/', auth, authorize('admin'), reservationSourceController.createReservationSource);
router.get('/', auth, authorize('admin', 'manager', 'reception', 'housekeeping'), reservationSourceController.getAllReservationSources);
router.get('/:id', auth, authorize('admin', 'manager', 'reception', 'housekeeping'), reservationSourceController.getReservationSourceById);
router.put('/:id', auth, authorize('admin'), reservationSourceController.updateReservationSource);
router.delete('/:id', auth, authorize('admin'), reservationSourceController.deleteReservationSource);

module.exports = router;
