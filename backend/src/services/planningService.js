const { Room, Reservation } = require('../models');
const AppError = require('../utils/AppError');
const { toDay, addDays, ymd } = require('../utils/dates');
const roomService = require('./roomService');
const { byRoomNumber } = roomService;

const planningService = {
  // Planning des chambres sur 7 à 30 jours (CDC §Planning)
  async getPlanning(query = {}) {
    const days = Math.min(Math.max(parseInt(query.days, 10) || 7, 1), 30);
    const start = toDay(query.start || query.start_date || new Date());
    const end = addDays(start, days);
    const dates = Array.from({ length: days }, (_, i) => ymd(addDays(start, i)));

    const roomFilter = { is_active: { $ne: false } };
    if (query.room_type_id) roomFilter.room_type_id = query.room_type_id;
    const rooms = (await Room.find(roomFilter).populate('room_type_id')).sort(byRoomNumber);
    const occ = await roomService.buildOccupancy(rooms);

    const reservations = await Reservation.find({
      status: { $in: ['pending', 'confirmed', 'checked_in', 'checked_out'] },
      arrival_date: { $lt: end }, departure_date: { $gt: start },
      $or: [{ room_id: { $in: rooms.map((r) => r._id) } }, { 'rooms.room_id': { $in: rooms.map((r) => r._id) } }],
    }).populate('client_id', 'first_name last_name phone').lean();

    const byRoom = {};
    reservations.forEach((r) => {
      const ids = new Set([String(r.room_id), ...(r.rooms || []).map((l) => String(l.room_id))]);
      ids.forEach((rid) => {
        (byRoom[rid] = byRoom[rid] || []).push({
          _id: r._id, reservation_number: r.reservation_number, status: r.status, payment_status: r.payment_status,
          client_name: r.client_id ? `${r.client_id.first_name} ${r.client_id.last_name}` : 'Inconnu',
          arrival_date: r.arrival_date, departure_date: r.departure_date, nights: r.nights,
          balance_amount: r.balance_amount, adults_count: r.adults_count, multi_room: (r.rooms || []).length > 1,
        });
      });
    });

    const total = rooms.length || 1;
    const occupancy = dates.map((date) => {
      const d = toDay(date);
      let occupied = 0;
      Object.values(byRoom).forEach((list) => { if (list.some((r) => ['pending', 'confirmed', 'checked_in', 'checked_out'].includes(r.status) && r.status !== 'checked_out' && r.arrival_date <= d && r.departure_date > d)) occupied += 1; });
      return { date, occupied, rate: Math.round((occupied / total) * 100) };
    });

    return {
      start: ymd(start), end: ymd(end), days: dates, occupancy,
      rooms: rooms.map((room) => {
        const info = occ[String(room._id)];
        return {
          _id: room._id, room_number: room.room_number, floor: room.floor, room_type: room.room_type_id?.name, status: info.effective_status,
          base_price: room.base_price, reservations: byRoom[String(room._id)] || [],
        };
      }),
    };
  },
};

module.exports = planningService;
