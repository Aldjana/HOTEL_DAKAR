const { Payment, Reservation, PaymentMode } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { nextNumber } = require('./numberingService');
const { DEFAULT_PAYMENT_MODES } = require('./defaultsService');
const { toDay, addDays } = require('../utils/dates');
const cashService = require('./cashService');

const POPULATE = [
  { path: 'reservation_id', select: 'reservation_number client_id total_amount paid_amount balance_amount status payment_status arrival_date departure_date', populate: { path: 'client_id', select: 'first_name last_name phone' } },
  { path: 'processed_by', select: 'first_name last_name role' },
];

const genTransactionId = () => `TXN-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, '0')}`;

const getMethodDef = async (code) => {
  const count = await PaymentMode.countDocuments();
  if (count === 0) return DEFAULT_PAYMENT_MODES.find((m) => m.code === code) || null;
  return PaymentMode.findOne({ code, is_active: true });
};

const assertMethod = async (code, reference) => {
  const def = await getMethodDef(code);
  if (!def) throw AppError.badRequest(`Mode de paiement invalide ou désactivé : « ${code} »`);
  if (def.requires_reference && !String(reference || '').trim()) {
    throw AppError.badRequest(`Une référence est requise pour le mode « ${def.name} »`);
  }
  return def;
};

// Recalcule paid_amount / balance / payment_status d'une réservation à partir de ses paiements valides.
const recomputeReservation = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);
  if (!reservation) return null;
  const payments = await Payment.find({ reservation_id: reservationId, payment_status: { $in: ['completed', 'refunded'] } }).lean();
  const paidIn = payments.filter((p) => p.type !== 'refund').reduce((s, p) => s + p.amount, 0);
  const refunded = payments.filter((p) => p.type === 'refund').reduce((s, p) => s + p.amount, 0);
  const net = paidIn - refunded;
  reservation.paid_amount = net;
  reservation.balance_amount = reservation.total_amount - net;
  if (net <= 0) reservation.payment_status = refunded > 0 ? 'refunded' : 'unpaid';
  else if (net >= reservation.total_amount) reservation.payment_status = 'paid';
  else reservation.payment_status = ['pending', 'confirmed'].includes(reservation.status) ? 'deposit' : 'partial';
  await reservation.save();
  try { await require('./invoiceService').syncWithReservation(reservation); } catch (e) { /* facture optionnelle */ }
  return reservation;
};

const paymentService = {
  recomputeReservation,

  async getMethods() {
    const count = await PaymentMode.countDocuments();
    if (count === 0) return DEFAULT_PAYMENT_MODES.map((m) => ({ ...m, is_active: true }));
    return PaymentMode.find({ is_active: true }).sort({ name: 1 });
  },

  async createPayment(data, user) {
    const reservation = await Reservation.findById(data.reservation_id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    if (reservation.status === 'cancelled') throw AppError.conflict('Impossible d\'enregistrer un paiement sur une réservation annulée');
    const amount = Math.round(Number(data.amount));
    if (!(amount > 0)) throw AppError.badRequest('Le montant doit être supérieur à 0');
    await assertMethod(data.payment_method, data.reference);
    await cashService.assertDayOpen(data.payment_date || new Date());

    const due = reservation.total_amount - (reservation.paid_amount || 0);
    if (amount > due && !data.allow_overpayment) {
      throw AppError.badRequest(`Le montant (${amount}) dépasse le solde restant dû (${Math.max(due, 0)})`);
    }

    const payment = await Payment.create({
      reservation_id: reservation._id,
      client_id: reservation.client_id,
      processed_by: user?._id,
      transaction_id: genTransactionId(),
      receipt_number: await nextNumber('receipt'),
      type: 'payment',
      amount,
      payment_method: data.payment_method,
      payment_status: 'completed',
      payment_date: data.payment_date ? new Date(data.payment_date) : new Date(),
      description: data.description,
      reference: data.reference,
    });
    const updated = await recomputeReservation(reservation._id);
    return { payment: await Payment.findById(payment._id).populate(POPULATE), reservation: updated };
  },

  buildFilter(query = {}) {
    const f = {};
    if (query.reservation_id) f.reservation_id = query.reservation_id;
    if (query.client_id) f.client_id = query.client_id;
    if (query.payment_method || query.method) f.payment_method = query.payment_method || query.method;
    if (query.type) f.type = query.type;
    if (query.processed_by) f.processed_by = query.processed_by;
    if (query.status || query.payment_status) f.payment_status = query.status || query.payment_status;
    else if (!query.include_voided) f.payment_status = { $ne: 'voided' };
    const from = query.from || query.start_date;
    const to = query.to || query.end_date;
    if (from || to) {
      f.payment_date = {};
      if (from) f.payment_date.$gte = toDay(from);
      if (to) f.payment_date.$lt = addDays(toDay(to), 1);
    }
    return f;
  },

  async getAllPayments(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = this.buildFilter(query);
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search), 'i');
      const { Client } = require('../models');
      const clients = await Client.find({ $or: [{ first_name: rx }, { last_name: rx }] }).select('_id');
      const reservations = await Reservation.find({ $or: [{ reservation_number: rx }, { client_id: { $in: clients.map((c) => c._id) } }] }).select('_id');
      filter.$or = [{ transaction_id: rx }, { reference: rx }, { receipt_number: rx }, { reservation_id: { $in: reservations.map((r) => r._id) } }];
    }
    const [payments, total] = await Promise.all([
      Payment.find(filter).populate(POPULATE).sort({ payment_date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Payment.countDocuments(filter),
    ]);
    return { payments, total, page, limit };
  },

  async getPaymentById(id) {
    const p = await Payment.findById(id).populate(POPULATE);
    if (!p) throw AppError.notFound('Paiement non trouvé');
    return p;
  },

  async getPaymentsByReservation(reservationId) {
    return Payment.find({ reservation_id: reservationId }).populate(POPULATE).sort({ payment_date: -1 });
  },

  // Correction tracée (CDC : correction/suppression de paiement tracée, rôles limités)
  async updatePayment(id, data, user) {
    const payment = await Payment.findById(id);
    if (!payment) throw AppError.notFound('Paiement non trouvé');
    if (payment.payment_status === 'voided') throw AppError.conflict('Ce paiement est annulé et ne peut plus être modifié');
    if (!String(data.reason || '').trim()) throw AppError.badRequest('Un motif de correction est requis');
    await cashService.assertDayOpen(payment.payment_date);
    if (data.payment_date) await cashService.assertDayOpen(data.payment_date);

    const before = { amount: payment.amount, payment_method: payment.payment_method, payment_date: payment.payment_date, reference: payment.reference, description: payment.description };
    if (data.payment_method !== undefined) {
      await assertMethod(data.payment_method, data.reference ?? payment.reference);
      payment.payment_method = data.payment_method;
    }
    if (data.amount !== undefined) {
      const a = Math.round(Number(data.amount));
      if (!(a > 0)) throw AppError.badRequest('Le montant doit être supérieur à 0');
      payment.amount = a;
    }
    if (data.payment_date) payment.payment_date = new Date(data.payment_date);
    if (data.reference !== undefined) payment.reference = data.reference;
    if (data.description !== undefined) payment.description = data.description;
    payment.corrections.push({ at: new Date(), by: user?._id, reason: data.reason, before });
    await payment.save();
    const reservation = await recomputeReservation(payment.reservation_id);
    return { payment: await Payment.findById(id).populate(POPULATE), reservation, before };
  },

  async voidPayment(id, reason, user) {
    const payment = await Payment.findById(id);
    if (!payment) throw AppError.notFound('Paiement non trouvé');
    if (payment.payment_status === 'voided') throw AppError.conflict('Paiement déjà annulé');
    if (!String(reason || '').trim()) throw AppError.badRequest("Un motif d'annulation est requis");
    await cashService.assertDayOpen(payment.payment_date);
    payment.payment_status = 'voided';
    payment.voided_at = new Date();
    payment.voided_by = user?._id;
    payment.void_reason = reason;
    await payment.save();
    const reservation = await recomputeReservation(payment.reservation_id);
    return { payment, reservation };
  },

  async refundPayment(id, data = {}, user) {
    const original = await Payment.findById(id);
    if (!original) throw AppError.notFound('Paiement non trouvé');
    if (original.type === 'refund' || original.payment_status !== 'completed') throw AppError.conflict('Ce paiement ne peut pas être remboursé');
    const already = await Payment.aggregate([
      { $match: { refund_of: original._id, payment_status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const refundable = original.amount - (already[0]?.total || 0);
    const amount = data.amount !== undefined ? Math.round(Number(data.amount)) : refundable;
    if (!(amount > 0) || amount > refundable) throw AppError.badRequest(`Montant remboursable maximum : ${refundable}`);
    const method = data.payment_method || original.payment_method;
    await assertMethod(method, data.reference);
    await cashService.assertDayOpen(new Date());

    const refund = await Payment.create({
      reservation_id: original.reservation_id,
      client_id: original.client_id,
      processed_by: user?._id,
      transaction_id: genTransactionId(),
      type: 'refund',
      refund_of: original._id,
      amount,
      payment_method: method,
      payment_status: 'completed',
      payment_date: new Date(),
      description: data.reason || 'Remboursement',
      reference: data.reference,
    });
    if (amount === refundable) { original.payment_status = 'refunded'; await original.save(); }
    // Un paiement 'refunded' compte encore dans les entrées ; le remboursement le compense.
    const reservation = await recomputeReservationWithRefunded(original.reservation_id);
    return { refund: await Payment.findById(refund._id).populate(POPULATE), reservation };
  },

  async getPaymentSummary(query = {}) {
    const filter = this.buildFilter({ ...query, status: undefined, payment_status: undefined });
    filter.payment_status = { $in: ['completed', 'refunded'] };
    const list = await Payment.find(filter).lean();
    const byMethod = {};
    let total_in = 0; let total_refunds = 0;
    for (const p of list) {
      byMethod[p.payment_method] = byMethod[p.payment_method] || { in: 0, refunds: 0, net: 0, count: 0 };
      if (p.type === 'refund') { total_refunds += p.amount; byMethod[p.payment_method].refunds += p.amount; byMethod[p.payment_method].net -= p.amount; }
      else { total_in += p.amount; byMethod[p.payment_method].in += p.amount; byMethod[p.payment_method].net += p.amount; }
      byMethod[p.payment_method].count += 1;
    }
    return { total_in, total_refunds, net_total: total_in - total_refunds, count: list.length, by_method: byMethod };
  },
};

// Les paiements 'refunded' (remboursés totalement) restent des entrées ; on les compte donc aussi.
async function recomputeReservationWithRefunded(reservationId) {
  return recomputeReservation(reservationId);
}

module.exports = paymentService;
