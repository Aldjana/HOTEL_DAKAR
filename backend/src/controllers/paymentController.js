const service = require('../services/paymentService');
const pdfService = require('../services/pdfService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

const log = (req, p, action, description, metadata) => audit.log(req, { entity_type: 'payment', entity_id: p._id, action, description, metadata });

module.exports = {
  createPayment: h(async (req, res) => {
    const { payment, reservation } = await service.createPayment(req.body, req.user);
    log(req, payment, 'payment', `Paiement de ${payment.amount} (${payment.payment_method}) sur ${reservation.reservation_number}`);
    response.created(res, { ...payment.toObject(), reservation_summary: { paid_amount: reservation.paid_amount, balance_amount: reservation.balance_amount, payment_status: reservation.payment_status } }, 'Paiement enregistré');
  }),
  getAllPayments: h(async (req, res) => { const r = await service.getAllPayments(req.query); response.paginated(res, r.payments, r, 'Paiements récupérés'); }),
  getMethods: h(async (req, res) => response.success(res, await service.getMethods())),
  getPaymentById: h(async (req, res) => response.success(res, await service.getPaymentById(req.params.id))),
  getPaymentsByReservation: h(async (req, res) => response.success(res, await service.getPaymentsByReservation(req.params.reservationId || req.query.reservation_id))),
  getPaymentsByDateRange: h(async (req, res) => {
    const r = await service.getAllPayments({ ...req.query, from: req.query.start_date || req.query.from, to: req.query.end_date || req.query.to, limit: 200 });
    response.success(res, r.payments);
  }),
  getPaymentSummary: h(async (req, res) => response.success(res, await service.getPaymentSummary(req.query))),
  updatePayment: h(async (req, res) => {
    const r = await service.updatePayment(req.params.id, req.body, req.user);
    log(req, r.payment, 'update', `Correction du paiement ${r.payment.transaction_id}`, { reason: req.body.reason, before: r.before });
    response.success(res, r.payment, 'Paiement corrigé');
  }),
  voidPayment: h(async (req, res) => {
    const r = await service.voidPayment(req.params.id, req.body.reason || req.query.reason, req.user);
    log(req, r.payment, 'void', `Annulation du paiement ${r.payment.transaction_id}`, { reason: req.body.reason || req.query.reason });
    response.success(res, r.payment, 'Paiement annulé');
  }),
  refundPayment: h(async (req, res) => {
    const r = await service.refundPayment(req.params.id, req.body, req.user);
    log(req, r.refund, 'refund', `Remboursement de ${r.refund.amount}`, { original: req.params.id });
    response.created(res, r.refund, 'Remboursement enregistré');
  }),
  getReceiptPdf: h(async (req, res) => {
    const d = await pdfService.receipt(req.params.id, req.user);
    pdfService.sendPdf(res, d.buffer, d.filename, req.query.download === '1');
  }),
};
