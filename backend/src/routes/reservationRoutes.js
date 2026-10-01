const express = require('express');
const router = express.Router();
const c = require('../controllers/reservationController');
const { auth, requirePermission } = require('../middleware');
const v = require('../validators').reservation;

const read = [auth, requirePermission('reservations.read')];
const write = [auth, requirePermission('reservations.write')];

router.post('/', ...write, v.createReservationValidation, c.createReservation);
router.get('/', ...read, c.getAllReservations);
router.get('/arrivals-departures', ...read, c.getArrivalsDepartures);
router.get('/by-date', ...read, c.getReservationsByDate);
router.get('/by-date-range', ...read, c.getReservationsByDateRange);
router.get('/by-status', ...read, c.getReservationsByStatus);
router.get('/:id', ...read, c.getReservationById);
router.get('/:id/history', ...read, c.getReservationHistory);
router.get('/:id/summary-pdf', ...read, c.getSummaryPdf);
router.put('/:id', ...write, v.updateReservationValidation, c.updateReservation);
router.post('/:id/change-room', ...write, c.changeRoom);
router.post('/:id/check-in', ...write, v.checkInValidation, c.checkIn);
router.post('/:id/check-out', ...write, v.checkOutValidation, c.checkOut);
router.post('/:id/cancel', ...write, c.cancelReservation);
router.post('/:id/no-show', ...write, c.markNoShow);

module.exports = router;
