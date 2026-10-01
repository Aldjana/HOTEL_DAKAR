const { Room, Reservation } = require('../models');
const AppError = require('../utils/AppError');
const { toDay, today } = require('../utils/dates');

const BLOCKING = Reservation.BLOCKING_STATUSES;
const UNBOOKABLE_ROOM_STATUSES = ['maintenance', 'blocked', 'out_of_order'];

// Réservations bloquantes qui chevauchent [arrival, departure[ pour les chambres données.
// Un départ le jour même d'une arrivée est autorisé (rotation dans la journée).
const findConflicts = async (roomIds, arrival, departure, excludeReservationId = null) => {
  const ids = roomIds.map(String);
  const filter = {
    status: { $in: BLOCKING },
    arrival_date: { $lt: toDay(departure) },
    departure_date: { $gt: toDay(arrival) },
    $or: [{ room_id: { $in: ids } }, { 'rooms.room_id': { $in: ids } }],
  };
  if (excludeReservationId) filter._id = { $ne: excludeReservationId };
  const list = await Reservation.find(filter).populate('client_id', 'first_name last_name').lean();
  return list;
};

const assertRoomsBookable = (rooms, arrival) => {
  for (const room of rooms) {
    if (!room.is_active) {
      throw AppError.conflict(`La chambre ${room.room_number} est désactivée`, 'ROOM_INACTIVE');
    }
    if (UNBOOKABLE_ROOM_STATUSES.includes(room.status) && toDay(arrival) <= today()) {
      throw AppError.conflict(`La chambre ${room.room_number} est indisponible (${room.status === 'maintenance' ? 'en maintenance' : 'bloquée'})`, 'ROOM_UNAVAILABLE');
    }
  }
};

const describeConflict = (conflict, roomNumberById = {}) => {
  const c = conflict.client_id;
  const who = c ? `${c.first_name} ${c.last_name}` : 'un client';
  const d = (x) => new Date(x).toISOString().slice(0, 10);
  return `${conflict.reservation_number} (${who}, ${d(conflict.arrival_date)} → ${d(conflict.departure_date)})`;
};

const assertNoConflict = async (rooms, arrival, departure, excludeReservationId) => {
  const conflicts = await findConflicts(rooms.map((r) => r._id), arrival, departure, excludeReservationId);
  if (conflicts.length) {
    const first = conflicts[0];
    const err = AppError.conflict(
      `Chambre indisponible sur cette période : déjà réservée par ${describeConflict(first)}`,
      'ROOM_NOT_AVAILABLE'
    );
    err.errors = conflicts.map((c) => ({ reservation_id: c._id, reservation_number: c.reservation_number, arrival_date: c.arrival_date, departure_date: c.departure_date }));
    throw err;
  }
};

const getAvailableRooms = async (arrival, departure, { room_type_id, excludeReservationId, adults } = {}) => {
  const q = { is_active: { $ne: false } };
  if (room_type_id) q.room_type_id = room_type_id;
  let rooms = await Room.find(q).populate('room_type_id').sort({ room_number: 1 });
  if (adults) rooms = rooms.filter((r) => (r.max_adults || 1) >= Number(adults));
  if (arrival && departure) {
    if (toDay(departure) <= toDay(arrival)) throw AppError.badRequest("La date de départ doit être après la date d'arrivée");
    const conflicts = await findConflicts(rooms.map((r) => r._id), arrival, departure, excludeReservationId);
    const busy = new Set();
    conflicts.forEach((c) => {
      busy.add(String(c.room_id));
      (c.rooms || []).forEach((l) => busy.add(String(l.room_id)));
    });
    rooms = rooms.filter((r) => !busy.has(String(r._id)));
    if (toDay(arrival) <= today()) rooms = rooms.filter((r) => !UNBOOKABLE_ROOM_STATUSES.includes(r.status));
  } else {
    rooms = rooms.filter((r) => !UNBOOKABLE_ROOM_STATUSES.includes(r.status));
  }
  return rooms;
};

module.exports = { findConflicts, assertNoConflict, assertRoomsBookable, getAvailableRooms, UNBOOKABLE_ROOM_STATUSES };
