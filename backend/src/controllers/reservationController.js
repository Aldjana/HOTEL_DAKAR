const service = require('../services/reservationService');
const audit = require('../services/auditService');
const pdfService = require('../services/pdfService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

const log = (req, r, action, description, metadata) =>
  audit.log(req, { entity_type: 'reservation', entity_id: r._id, action, description, metadata });

module.exports = {
  createReservation: h(async (req, res) => {
    const r = await service.createReservation(req.body, req.user);
    log(req, r, 'create', `Création de la réservation ${r.reservation_number}`);
    response.created(res, r, 'Réservation créée avec succès');
  }),
  getAllReservations: h(async (req, res) => {
    const r = await service.getAllReservations(req.query);
    response.paginated(res, r.reservations, r, 'Réservations récupérées');
  }),
  getReservationById: h(async (req, res) => response.success(res, await service.getReservationById(req.params.id))),
  getReservationHistory: h(async (req, res) => response.success(res, await service.getReservationHistory(req.params.id))),
  updateReservation: h(async (req, res) => {
    const r = await service.updateReservation(req.params.id, req.body, req.user);
    log(req, r, 'update', `Modification de la réservation ${r.reservation_number}`, { fields: Object.keys(req.body) });
    response.success(res, r, 'Réservation mise à jour');
  }),
  changeRoom: h(async (req, res) => {
    const out = await service.changeRoom(req.params.id, req.body, req.user);
    log(req, out.reservation, 'change_room', `Changement de chambre de ${out.reservation.reservation_number}`, { to: out.new_room_id, reason: req.body.reason });
    response.success(res, out.reservation, 'Chambre modifiée');
  }),
  checkIn: h(async (req, res) => {
    const r = await service.checkIn(req.params.id, req.body, req.user);
    log(req, r, 'check_in', `Check-in de ${r.reservation_number}`);
    response.success(res, r, 'Check-in réussi');
  }),
  checkOut: h(async (req, res) => {
    const r = await service.checkOut(req.params.id, req.body, req.user);
    log(req, r, 'check_out', `Check-out de ${r.reservation_number}`);
    response.success(res, r, 'Check-out réussi');
  }),
  cancelReservation: h(async (req, res) => {
    const r = await service.cancelReservation(req.params.id, req.body, req.user);
    log(req, r, 'cancel', `Annulation de ${r.reservation_number}`, { reason: req.body.reason });
    response.success(res, r, 'Réservation annulée');
  }),
  markNoShow: h(async (req, res) => {
    const r = await service.markNoShow(req.params.id, req.body, req.user);
    log(req, r, 'no_show', `No-show ${r.reservation_number}`);
    response.success(res, r, 'Réservation marquée no-show');
  }),
  getArrivalsDepartures: h(async (req, res) => response.success(res, await service.getArrivalsAndDepartures(req.query.date))),
  getReservationsByDate: h(async (req, res) => response.success(res, await service.getReservationsByDate(req.query.date))),
  getReservationsByDateRange: h(async (req, res) => response.success(res, await service.getReservationsByDateRange(req.query.start_date || req.query.from, req.query.end_date || req.query.to))),
  getReservationsByStatus: h(async (req, res) => response.success(res, await service.getReservationsByStatus(req.query.status))),
  getSummaryPdf: h(async (req, res) => {
    const doc = await pdfService.reservationSummary(req.params.id, req.user);
    pdfService.sendPdf(res, doc.buffer, doc.filename, req.query.download === '1');
  }),
};
