const { Payment, CashClosure, User } = require('../models');
const AppError = require('../utils/AppError');
const { toDay, addDays, ymd } = require('../utils/dates');

const dayRange = (date) => { const d = toDay(date || new Date()); return { d, from: d, to: addDays(d, 1) }; };

const cashService = {
  async assertDayOpen(date) {
    const key = ymd(toDay(date || new Date()));
    const closure = await CashClosure.findOne({ date: key });
    if (closure) throw AppError.conflict(`La caisse du ${key} est clôturée : les paiements de cette journée ne peuvent plus être modifiés`, 'CASH_CLOSED');
  },

  async getDaily(query = {}) {
    const { d, from, to } = dayRange(query.date);
    const filter = { payment_date: { $gte: from, $lt: to }, payment_status: { $in: ['completed', 'refunded'] } };
    if (query.user_id) filter.processed_by = query.user_id;
    if (query.method || query.payment_method) filter.payment_method = query.method || query.payment_method;
    const payments = await Payment.find(filter)
      .populate({ path: 'reservation_id', select: 'reservation_number client_id', populate: { path: 'client_id', select: 'first_name last_name' } })
      .populate('processed_by', 'first_name last_name').sort({ payment_date: 1 });
    const voided = await Payment.find({ payment_date: { $gte: from, $lt: to }, payment_status: 'voided' }).select('amount payment_method transaction_id void_reason');

    const by_method = {}; const by_user = {};
    let total_in = 0; let total_refunds = 0;
    payments.forEach((p) => {
      const sign = p.type === 'refund' ? -1 : 1;
      by_method[p.payment_method] = by_method[p.payment_method] || { in: 0, refunds: 0, net: 0, count: 0 };
      const m = by_method[p.payment_method];
      if (sign === 1) { m.in += p.amount; total_in += p.amount; } else { m.refunds += p.amount; total_refunds += p.amount; }
      m.net += sign * p.amount; m.count += 1;
      const uname = p.processed_by ? `${p.processed_by.first_name} ${p.processed_by.last_name}` : 'Inconnu';
      by_user[uname] = (by_user[uname] || 0) + sign * p.amount;
    });
    const closure = await CashClosure.findOne({ date: ymd(d) }).populate('closed_by', 'first_name last_name');
    return {
      date: ymd(d), payments, voided_count: voided.length,
      totals: { total_in, total_refunds, net_total: total_in - total_refunds, count: payments.length, cash_expected: by_method.cash?.net || 0 },
      by_method, by_user, closure, is_closed: !!closure,
    };
  },

  async close({ date, counted_cash, notes }, user) {
    const day = await this.getDaily({ date });
    if (day.is_closed) throw AppError.conflict(`La caisse du ${day.date} est déjà clôturée`, 'CASH_CLOSED');
    if (day.date > ymd(new Date())) throw AppError.badRequest('Impossible de clôturer une date future');
    const counted = counted_cash === undefined || counted_cash === '' || counted_cash === null ? undefined : Number(counted_cash);
    if (counted !== undefined && !(counted >= 0)) throw AppError.badRequest('Montant compté invalide');
    const closure = await CashClosure.create({
      date: day.date, closed_by: user?._id, totals_by_method: day.by_method,
      total_in: day.totals.total_in, total_refunds: day.totals.total_refunds, net_total: day.totals.net_total,
      expected_cash: day.totals.cash_expected, counted_cash: counted, difference: counted === undefined ? 0 : counted - day.totals.cash_expected,
      payments_count: day.totals.count, notes,
    });
    return closure;
  },

  async reopen(date) {
    const closure = await CashClosure.findOneAndDelete({ date: ymd(toDay(date)) });
    if (!closure) throw AppError.notFound('Aucune clôture pour cette date');
    return closure;
  },

  async listClosures(query = {}) {
    const filter = {};
    if (query.from || query.to) { filter.date = {}; if (query.from) filter.date.$gte = ymd(toDay(query.from)); if (query.to) filter.date.$lte = ymd(toDay(query.to)); }
    return CashClosure.find(filter).populate('closed_by', 'first_name last_name').sort({ date: -1 }).limit(90);
  },

  async cashiers() {
    return User.find({ is_active: true, role: { $in: ['admin', 'manager', 'reception'] } }).select('first_name last_name role');
  },
};

module.exports = cashService;
