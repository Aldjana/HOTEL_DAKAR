const { Reservation, Payment, Room, Client, HistoryLog, Document } = require('../models');
const { toDay, today, addDays, ymd, diffDays } = require('../utils/dates');
const AppError = require('../utils/AppError');

const range = (query = {}) => {
  const to = toDay(query.to || query.end_date || new Date());
  const from = toDay(query.from || query.start_date || addDays(to, -29));
  if (to < from) throw AppError.badRequest('La date de fin doit être après la date de début');
  if (diffDays(from, to) > 366) throw AppError.badRequest('Période maximale : 366 jours');
  return { from, to, toExclusive: addDays(to, 1), days: diffDays(from, to) + 1 };
};

const eachDay = (from, days) => Array.from({ length: days }, (_, i) => ymd(addDays(from, i)));

const activeRooms = () => Room.find({ is_active: { $ne: false } }).populate('room_type_id');

// Nuits occupées par jour (séjours confirmés, en cours ou terminés)
const occupancySeries = async (from, days) => {
  const to = addDays(from, days);
  const rooms = await activeRooms();
  const total = rooms.length;
  const reservations = await Reservation.find({ status: { $in: ['confirmed', 'checked_in', 'checked_out'] }, arrival_date: { $lt: to }, departure_date: { $gt: from } }).lean();
  return eachDay(from, days).map((date) => {
    const d = toDay(date);
    const inRes = reservations.filter((r) => r.arrival_date <= d && r.departure_date > d);
    const occupied = inRes.reduce((s, r) => s + Math.max((r.rooms || []).length, 1), 0);
    const arrivals = reservations.filter((r) => ymd(r.arrival_date) === date).length;
    const departures = reservations.filter((r) => ymd(r.departure_date) === date).length;
    return { date, occupied: Math.min(occupied, total), total, rate: total ? Math.round((Math.min(occupied, total) / total) * 100) : 0, arrivals, departures };
  });
};

// CA prévisionnel par nuit (après `to` et après aujourd'hui, jusqu'à `forecastTo`) : revenu chambre
// des séjours non annulés qui occupent la nuit, réparti à parts égales sur les nuits du séjour.
const forecastSeries = async (to, forecastTo) => {
  const start = addDays(to > today() ? to : today(), 1);
  const end = toDay(forecastTo);
  if (!end || end < start) return [];
  if (diffDays(start, end) > 62) throw AppError.badRequest('Horizon prévisionnel maximal : 62 jours');
  const days = diffDays(start, end) + 1;
  const reservations = await Reservation.find({ status: { $in: Reservation.BLOCKING_STATUSES }, arrival_date: { $lte: end }, departure_date: { $gt: start } }).lean();
  return eachDay(start, days).map((date) => {
    const d = toDay(date);
    const amount = reservations
      .filter((r) => r.arrival_date <= d && r.departure_date > d)
      .reduce((s, r) => s + Math.max((r.subtotal_amount || 0) - (r.discount_amount || 0), 0) / Math.max(r.nights || diffDays(r.arrival_date, r.departure_date), 1), 0);
    return { date, amount: Math.round(amount) };
  });
};

const paymentsInRange = async (from, toExclusive) => Payment.find({ payment_date: { $gte: from, $lt: toExclusive }, payment_status: { $in: ['completed', 'refunded'] } }).lean();

const reportService = {
  range, occupancySeries,

  async overview(query = {}) {
    const { from, to, toExclusive, days } = range(query);
    const [payments, series, reservations, newClients, forecast] = await Promise.all([
      paymentsInRange(from, toExclusive),
      occupancySeries(from, days),
      Reservation.find({ arrival_date: { $gte: from, $lt: toExclusive } }).populate('client_id', 'first_name last_name company').populate({ path: 'room_id', populate: 'room_type_id' }).lean(),
      Client.countDocuments({ createdAt: { $gte: from, $lt: toExclusive } }),
      query.forecast_to ? forecastSeries(to, query.forecast_to) : [],
    ]);

    const revenueByDay = Object.fromEntries(eachDay(from, days).map((d) => [d, 0]));
    const byMethod = {};
    let revenue = 0;
    payments.forEach((p) => {
      const sign = p.type === 'refund' ? -1 : 1;
      revenue += sign * p.amount;
      const k = ymd(p.payment_date);
      if (k in revenueByDay) revenueByDay[k] += sign * p.amount;
      byMethod[p.payment_method] = (byMethod[p.payment_method] || 0) + sign * p.amount;
    });

    const valid = reservations.filter((r) => !['cancelled', 'no_show'].includes(r.status));
    const byStatus = {}; const bySource = {}; const byType = {}; const topClients = {};
    reservations.forEach((r) => { byStatus[r.status] = (byStatus[r.status] || 0) + 1; });
    valid.forEach((r) => {
      bySource[r.source || 'autre'] = (bySource[r.source || 'autre'] || 0) + 1;
      const t = r.room_id?.room_type_id?.name || 'Autre';
      byType[t] = (byType[t] || 0) + r.total_amount;
      const cn = r.client_id ? (r.client_id.company || `${r.client_id.first_name} ${r.client_id.last_name}`) : 'Inconnu';
      topClients[cn] = (topClients[cn] || 0) + r.total_amount;
    });

    const occupiedNights = series.reduce((s, d) => s + d.occupied, 0);
    const availableNights = series.reduce((s, d) => s + d.total, 0);
    const roomRevenue = valid.reduce((s, r) => s + (r.subtotal_amount - r.discount_amount), 0);
    const cancelled = reservations.filter((r) => r.status === 'cancelled').length;

    return {
      from: ymd(from), to: ymd(to), days,
      revenue, revenue_by_method: byMethod,
      revenue_series: Object.entries(revenueByDay).map(([date, amount]) => ({ date, amount })),
      forecast_series: forecast,
      occupancy_series: series,
      occupancy_rate: availableNights ? Math.round((occupiedNights / availableNights) * 1000) / 10 : 0,
      adr: occupiedNights ? Math.round(roomRevenue / occupiedNights) : 0,
      revpar: availableNights ? Math.round(roomRevenue / availableNights) : 0,
      reservations_count: reservations.length,
      cancellation_rate: reservations.length ? Math.round((cancelled / reservations.length) * 1000) / 10 : 0,
      by_status: byStatus, by_source: bySource, revenue_by_room_type: byType,
      top_clients: Object.entries(topClients).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, amount]) => ({ name, amount })),
      new_clients: newClients,
    };
  },

  async occupancy(query = {}) {
    const { from, days, to } = range(query);
    return { from: ymd(from), to: ymd(to), rows: await occupancySeries(from, days) };
  },

  async receivables() {
    const list = await Reservation.find({ status: { $in: ['confirmed', 'checked_in', 'checked_out', 'pending'] }, balance_amount: { $gt: 0 } })
      .populate('client_id', 'first_name last_name phone company').sort({ departure_date: 1 }).lean();
    const rows = list.map((r) => ({
      reservation_id: r._id, reservation_number: r.reservation_number,
      client_name: r.client_id ? `${r.client_id.first_name} ${r.client_id.last_name}` : 'Inconnu', client_phone: r.client_id?.phone,
      arrival_date: r.arrival_date, departure_date: r.departure_date, status: r.status,
      total_amount: r.total_amount, paid_amount: r.paid_amount, balance_amount: r.balance_amount,
    }));
    return { total_due: rows.reduce((s, r) => s + r.balance_amount, 0), count: rows.length, rows };
  },

  // Indicateurs d'usage (CDC §Indicateurs de suivi) : connexions, exports, documents générés
  async usage(query = {}) {
    const { from, toExclusive } = range(query);
    const logs = await HistoryLog.find({ createdAt: { $gte: from, $lt: toExclusive }, action: { $in: ['login', 'export'] } }).lean();
    const docs = await Document.find({ createdAt: { $gte: from, $lt: toExclusive } }).lean();
    const logins = logs.filter((l) => l.action === 'login');
    const perUser = {};
    logins.forEach((l) => { perUser[l.user_name || 'Inconnu'] = (perUser[l.user_name || 'Inconnu'] || 0) + 1; });
    const docsByType = {};
    docs.forEach((d) => { docsByType[d.document_type] = (docsByType[d.document_type] || 0) + 1; });
    return {
      logins: logins.length, active_users: Object.keys(perUser).length, logins_by_user: perUser,
      exports: logs.filter((l) => l.action === 'export').length, documents_generated: docs.length, documents_by_type: docsByType,
    };
  },
};

module.exports = reportService;
