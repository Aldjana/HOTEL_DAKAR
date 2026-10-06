const { Room, RoomType, Reservation } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { toDay, today, ymd } = require('../utils/dates');
const availability = require('./availabilityService');

const assertImageUrl = (u) => {
  if (u === undefined || u === null || u === '') return u;
  if (!/^https?:\/\/\S+$/i.test(String(u))) throw AppError.badRequest("L'URL de l'image est invalide (envoyez l'image via le bouton Photo)");
  return u;
};

const MANUAL_STATUSES = ['available', 'clean', 'cleaning', 'maintenance', 'blocked'];
const LOCKED = ['maintenance', 'blocked', 'out_of_order'];

const reservationBrief = (r) => r && ({
  _id: r._id,
  reservation_number: r.reservation_number,
  client_id: r.client_id,
  client_name: r.client_id?.first_name ? `${r.client_id.first_name} ${r.client_id.last_name}` : 'Inconnu',
  client_phone: r.client_id?.phone,
  arrival_date: r.arrival_date,
  departure_date: r.departure_date,
  adults_count: r.adults_count,
  children_count: r.children_count,
  status: r.status,
  payment_status: r.payment_status,
  total_amount: r.total_amount,
  paid_amount: r.paid_amount,
  balance_amount: r.balance_amount,
});

const roomIdsOf = (r) => [...new Set([String(r.room_id), ...(r.rooms || []).map((l) => String(l.room_id))])];

// Associe à chaque chambre son occupant / sa prochaine réservation à une date donnée.
// Tri naturel des numéros de chambre : 8, 9, 101… (et non 101, 102… 8, 9).
const byRoomNumber = (a, b) => String(a.room_number).localeCompare(String(b.room_number), 'fr', { numeric: true });

const buildOccupancy = async (rooms, dateInput) => {
  const date = toDay(dateInput || new Date());
  const ids = rooms.map((r) => r._id);
  const reservations = await Reservation.find({
    status: { $in: ['pending', 'confirmed', 'checked_in', 'checked_out'] },
    $or: [{ room_id: { $in: ids } }, { 'rooms.room_id': { $in: ids } }],
  }).populate('client_id', 'first_name last_name phone').sort({ arrival_date: 1 }).lean();

  const perRoom = {};
  reservations.forEach((r) => roomIdsOf(r).forEach((rid) => { (perRoom[rid] = perRoom[rid] || []).push(r); }));

  const out = {};
  rooms.forEach((room) => {
    const list = perRoom[String(room._id)] || [];
    const inHouse = list.find((r) => r.status === 'checked_in');
    const covering = list.find((r) => ['pending', 'confirmed'].includes(r.status) && r.arrival_date <= date && r.departure_date > date);
    const upcoming = list.find((r) => ['pending', 'confirmed'].includes(r.status) && r.arrival_date > date);
    const last = [...list].reverse().find((r) => r.status === 'checked_out');

    let effective = room.status;
    let current = null;
    if (LOCKED.includes(room.status)) effective = room.status === 'out_of_order' ? 'blocked' : room.status;
    else if (inHouse) { effective = 'occupied'; current = inHouse; }
    else if (covering) { effective = room.status === 'cleaning' ? 'cleaning' : 'reserved'; current = covering; }
    else if (room.status === 'occupied') effective = 'available'; // incohérence corrigée : plus d'occupant réel
    else if (room.status === 'reserved') effective = 'available';
    out[String(room._id)] = {
      effective_status: effective,
      current: reservationBrief(current),
      next: reservationBrief(covering && !inHouse ? upcoming : (upcoming || null)),
      last: last ? { _id: last._id, client_name: last.client_id?.first_name ? `${last.client_id.first_name} ${last.client_id.last_name}` : 'Inconnu', departure_date: last.departure_date } : null,
    };
  });
  return out;
};

const shape = (room, occ) => {
  const o = room.toObject ? room.toObject() : room;
  const info = occ[String(o._id)] || {};
  return {
    ...o,
    number: o.room_number,
    type: o.room_type_id,
    price: o.base_price,
    capacity: o.max_adults,
    stored_status: o.status,
    status: info.effective_status || o.status,
    currentReservation: info.current || null,
    nextReservation: info.next || null,
    lastReservation: info.last || null,
  };
};

const roomService = {
  buildOccupancy,
  byRoomNumber,

  async getAllRooms(query = {}) {
    const filter = {};
    if (query.room_type_id) filter.room_type_id = query.room_type_id;
    if (query.floor !== undefined && query.floor !== '') filter.floor = Number(query.floor);
    if (query.view) filter.view = query.view;
    if (query.is_active !== undefined && query.is_active !== '') filter.is_active = String(query.is_active) === 'true';
    if (query.search) filter.room_number = new RegExp(escapeRegex(query.search.trim()), 'i');

    const { page, limit, skip } = parsePagination(query, { page: 1, limit: 100, max: 500 });
    const all = (await Room.find(filter).populate('room_type_id')).sort(byRoomNumber);
    const occ = await buildOccupancy(all, query.date);
    let shaped = all.map((r) => shape(r, occ));
    if (query.status) {
      const wanted = String(query.status).split(',');
      shaped = shaped.filter((r) => wanted.includes(r.status));
    }
    const total = shaped.length;
    return { rooms: shaped.slice(skip, skip + limit), total, page, limit };
  },

  async getRoomById(id) {
    const room = await Room.findById(id).populate('room_type_id');
    if (!room) throw AppError.notFound('Chambre non trouvée');
    const occ = await buildOccupancy([room]);
    const upcoming = await Reservation.find({
      $or: [{ room_id: id }, { 'rooms.room_id': id }],
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      departure_date: { $gt: today() },
    }).populate('client_id', 'first_name last_name phone').sort({ arrival_date: 1 }).limit(20);
    return { ...shape(room, occ), upcoming_reservations: upcoming };
  },

  async createRoom(data) {
    const type = await RoomType.findById(data.room_type_id);
    if (!type) throw AppError.badRequest('Type de chambre invalide');
    if (!String(data.room_number || '').trim()) throw AppError.badRequest('Le numéro de chambre est requis');
    if (await Room.findOne({ room_number: String(data.room_number).trim() })) throw AppError.conflict(`Le numéro de chambre ${data.room_number} existe déjà`);
    const price = data.base_price !== undefined && data.base_price !== '' ? Number(data.base_price) : type.base_price;
    if (!(price >= 0)) throw AppError.badRequest('Prix invalide');
    const status = MANUAL_STATUSES.includes(data.status) ? data.status : 'available';
    const room = await Room.create({
      room_number: String(data.room_number).trim(),
      room_type_id: type._id,
      floor: data.floor !== '' ? data.floor : undefined,
      status,
      is_active: data.is_active !== false,
      view: data.view || undefined,
      max_adults: data.max_adults ?? type.capacity_adults,
      max_children: data.max_children ?? type.capacity_children,
      base_price: price,
      amenities: Array.isArray(data.amenities) ? data.amenities : [],
      image_url: assertImageUrl(data.image_url),
      notes: data.notes,
    });
    return this.getRoomById(room._id);
  },

  async updateRoom(id, data) {
    const room = await Room.findById(id);
    if (!room) throw AppError.notFound('Chambre non trouvée');
    if (data.room_number !== undefined && String(data.room_number).trim() !== room.room_number) {
      const dup = await Room.findOne({ room_number: String(data.room_number).trim(), _id: { $ne: id } });
      if (dup) throw AppError.conflict(`Le numéro de chambre ${data.room_number} existe déjà`);
      room.room_number = String(data.room_number).trim();
    }
    if (data.room_type_id) {
      if (!(await RoomType.exists({ _id: data.room_type_id }))) throw AppError.badRequest('Type de chambre invalide');
      room.room_type_id = data.room_type_id;
    }
    for (const k of ['floor', 'view', 'max_adults', 'max_children', 'amenities', 'image_url', 'notes']) {
      if (k === 'image_url' && data[k] !== undefined) assertImageUrl(data[k]);
      if (data[k] !== undefined) room[k] = data[k] === '' ? undefined : data[k];
    }
    if (data.base_price !== undefined) {
      if (!(Number(data.base_price) >= 0)) throw AppError.badRequest('Prix invalide');
      room.base_price = Number(data.base_price);
    }
    if (data.is_active !== undefined && data.is_active !== room.is_active) await this.assertCanDeactivate(room, data.is_active);
    if (data.is_active !== undefined) room.is_active = !!data.is_active;
    await room.save();
    if (data.status !== undefined && data.status !== room.status) return this.updateRoomStatus(id, data.status);
    return this.getRoomById(id);
  },

  async assertCanDeactivate(room, willBeActive) {
    if (willBeActive) return;
    const blocking = await Reservation.countDocuments({
      $or: [{ room_id: room._id }, { 'rooms.room_id': room._id }],
      status: { $in: ['pending', 'confirmed', 'checked_in'] },
      departure_date: { $gt: today() },
    });
    if (blocking) throw AppError.conflict(`Impossible de désactiver la chambre ${room.room_number} : ${blocking} réservation(s) en cours ou à venir`);
  },

  async setActive(id, isActive) {
    const room = await Room.findById(id);
    if (!room) throw AppError.notFound('Chambre non trouvée');
    await this.assertCanDeactivate(room, !!isActive);
    room.is_active = !!isActive;
    await room.save();
    return this.getRoomById(id);
  },

  async deleteRoom(id) {
    const room = await Room.findById(id);
    if (!room) throw AppError.notFound('Chambre non trouvée');
    const count = await Reservation.countDocuments({ $or: [{ room_id: id }, { 'rooms.room_id': id }] });
    if (count > 0) throw AppError.conflict(`Cette chambre a ${count} réservation(s) : elle ne peut pas être supprimée. Désactivez-la à la place.`);
    await Room.deleteOne({ _id: id });
    return { message: 'Chambre supprimée avec succès', room_number: room.room_number };
  },

  async updateRoomStatus(id, status) {
    if (!MANUAL_STATUSES.includes(status)) {
      throw AppError.badRequest(status === 'occupied' || status === 'reserved'
        ? "Les statuts « occupée » et « réservée » sont gérés automatiquement (check-in / réservation)"
        : 'Statut de chambre invalide');
    }
    const room = await Room.findById(id);
    if (!room) throw AppError.notFound('Chambre non trouvée');
    const inHouse = await Reservation.findOne({ status: 'checked_in', $or: [{ room_id: id }, { 'rooms.room_id': id }] });
    if (inHouse && status !== 'cleaning') {
      throw AppError.conflict(`La chambre ${room.room_number} est occupée (${inHouse.reservation_number}) : effectuez d'abord le check-out`);
    }
    room.status = status;
    await room.save();
    let affected = 0;
    if (LOCKED.includes(status)) {
      affected = await Reservation.countDocuments({ $or: [{ room_id: id }, { 'rooms.room_id': id }], status: { $in: ['pending', 'confirmed'] }, departure_date: { $gt: today() } });
    }
    const out = await this.getRoomById(id);
    if (affected) out.warning = `${affected} réservation(s) à venir concernent cette chambre : pensez à changer de chambre.`;
    return out;
  },

  async getAvailableRooms(query = {}) {
    const start = query.start_date || query.arrival_date || query.from;
    const end = query.end_date || query.departure_date || query.to;
    const rooms = await availability.getAvailableRooms(start, end, {
      room_type_id: query.room_type_id, adults: query.adults, excludeReservationId: query.exclude_reservation_id,
    });
    return rooms.map((r) => ({ ...r.toObject(), number: r.room_number, type: r.room_type_id, price: r.base_price, capacity: r.max_adults }));
  },

  async getRoomStatistics() {
    const rooms = await Room.find({ is_active: { $ne: false } });
    const occ = await buildOccupancy(rooms);
    const counts = { total: rooms.length, available: 0, clean: 0, occupied: 0, reserved: 0, cleaning: 0, maintenance: 0, blocked: 0 };
    rooms.forEach((r) => { const s = occ[String(r._id)].effective_status; counts[s] = (counts[s] || 0) + 1; });
    counts.available += counts.clean; // « propre » = prête à vendre
    counts.out_of_order = counts.blocked;
    counts.occupancy_rate = counts.total ? Math.round((counts.occupied / counts.total) * 100) : 0;
    return counts;
  },

  async getRoomsByStatus(status) {
    if (!status) throw AppError.badRequest('Statut requis');
    return (await this.getAllRooms({ status, limit: 500 })).rooms;
  },

  async getRoomsByType(room_type_id) {
    if (!room_type_id) throw AppError.badRequest('Type de chambre requis');
    return (await this.getAllRooms({ room_type_id, limit: 500 })).rooms;
  },
};

module.exports = roomService;
