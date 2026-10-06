const { Reservation, Client, Payment } = require('../models');
const { toDay, addDays, ymd } = require('../utils/dates');
const roomService = require('./roomService');
const reportService = require('./reportService');

const POP = [{ path: 'client_id', select: 'first_name last_name phone' }, { path: 'room_id', populate: 'room_type_id' }];

const dashboardService = {
  async getDashboardStatistics(user) {
    const today = toDay(new Date());
    const tomorrow = addDays(today, 1);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const canSeeMoney = user ? ['admin', 'manager', 'reception'].includes(user.role) : true;

    const [roomStats, arrivals, departures, inHouse, options, monthReservations, newClients, upcoming] = await Promise.all([
      roomService.getRoomStatistics(),
      Reservation.find({ arrival_date: today, status: { $in: ['pending', 'confirmed', 'checked_in'] } }).populate(POP).sort({ createdAt: 1 }),
      Reservation.find({ departure_date: today, status: { $in: ['checked_in', 'checked_out'] } }).populate(POP).sort({ createdAt: 1 }),
      Reservation.find({ status: 'checked_in' }).populate(POP).sort({ departure_date: 1 }),
      Reservation.countDocuments({ status: 'pending' }),
      Reservation.countDocuments({ createdAt: { $gte: monthStart } }),
      Client.countDocuments({ createdAt: { $gte: monthStart } }),
      // Réservations à venir : arrivées des 7 prochains jours (hors aujourd'hui)
      Reservation.countDocuments({ arrival_date: { $gte: tomorrow, $lt: addDays(today, 8) }, status: { $in: ['pending', 'confirmed'] } }),
    ]);

    const alerts = [];
    inHouse.filter((r) => r.departure_date < today).forEach((r) => alerts.push({ type: 'overdue_departure', severity: 'high', message: `Départ dépassé : ${r.reservation_number} (${r.client_id?.first_name} ${r.client_id?.last_name})`, reservation_id: r._id }));
    const lateArrivals = await Reservation.find({ arrival_date: { $lt: today }, departure_date: { $gt: today }, status: { $in: ['pending', 'confirmed'] } }).populate(POP);
    lateArrivals.forEach((r) => alerts.push({ type: 'late_arrival', severity: 'medium', message: `Arrivée non enregistrée : ${r.reservation_number} (${r.client_id?.first_name} ${r.client_id?.last_name}) — attendue le ${ymd(r.arrival_date)}`, reservation_id: r._id }));
    if (roomStats.cleaning) alerts.push({ type: 'rooms_to_clean', severity: 'low', message: `${roomStats.cleaning} chambre(s) à nettoyer` });
    if (roomStats.maintenance) alerts.push({ type: 'maintenance', severity: 'low', message: `${roomStats.maintenance} chambre(s) en maintenance` });

    const out = {
      date: ymd(today),
      rooms: roomStats,
      occupancy_rate: roomStats.occupancy_rate,
      arrivals_count: arrivals.length,
      departures_count: departures.filter((r) => r.status === 'checked_in').length,
      in_house_count: inHouse.length,
      pending_options: options,
      upcoming_count: upcoming,
      reservations_this_month: monthReservations,
      new_clients_this_month: newClients,
      arrivals, departures, in_house: inHouse,
      alerts,
      occupancy_forecast: (await reportService.occupancySeries(today, 7)),
    };

    if (canSeeMoney) {
      const [todayPay, monthPay, unpaid] = await Promise.all([
        Payment.find({ payment_date: { $gte: today, $lt: tomorrow }, payment_status: { $in: ['completed', 'refunded'] } }).lean(),
        Payment.find({ payment_date: { $gte: monthStart, $lt: tomorrow }, payment_status: { $in: ['completed', 'refunded'] } }).lean(),
        Reservation.find({ status: { $in: ['confirmed', 'checked_in', 'checked_out'] }, balance_amount: { $gt: 0 } }).select('balance_amount').lean(),
      ]);
      const net = (l) => l.reduce((s, p) => s + (p.type === 'refund' ? -p.amount : p.amount), 0);
      out.revenue_today = net(todayPay);
      out.revenue_month = net(monthPay);
      out.unpaid_total = unpaid.reduce((s, r) => s + r.balance_amount, 0);
      out.unpaid_count = unpaid.length;
      out.revenue_series = (await reportService.overview({ from: ymd(addDays(today, -6)), to: ymd(today) })).revenue_series;
    }
    return out;
  },

  async getAvailabilityCalendar(query = {}) {
    return require('./planningService').getPlanning({ start: query.start_date || query.start, days: query.days || 14 });
  },
};

module.exports = dashboardService;
