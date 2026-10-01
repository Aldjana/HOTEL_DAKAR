const { Reservation, Room, Client, HousekeepingTask, Payment, Invoice, ReservationSource } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { toDay, today, addDays, ymd } = require('../utils/dates');
const { nextNumber } = require('./numberingService');
const availability = require('./availabilityService');
const { computePricing } = require('./pricingService');
const paymentService = require('./paymentService');
const { can } = require('../config/permissions');

const POPULATE = [
  { path: 'client_id', select: 'first_name last_name email phone company client_type is_vip nationality id_document_type id_document_number' },
  { path: 'room_id', populate: { path: 'room_type_id' } },
  { path: 'created_by', select: 'first_name last_name' },
];

const populateOne = (q) => q.populate(POPULATE);

const load = async (id) => {
  const r = await populateOne(Reservation.findById(id));
  if (!r) throw AppError.notFound('Réservation non trouvée');
  return r;
};

const allRoomIds = (r) => {
  const ids = new Set([String(r.room_id?._id || r.room_id)]);
  (r.rooms || []).forEach((l) => ids.add(String(l.room_id?._id || l.room_id)));
  return [...ids];
};

const assertSourceValid = async (source) => {
  if (!source) return;
  const count = await ReservationSource.countDocuments();
  if (count === 0) return;
  const ok = await ReservationSource.findOne({ code: source, is_active: true });
  if (!ok) throw AppError.badRequest(`Source de réservation invalide : « ${source} »`);
};

// Construit les lignes chambre (avec tarifs) à partir de la requête.
const buildRoomLines = async (data, user, existingLines = []) => {
  let requested = [];
  if (Array.isArray(data.rooms) && data.rooms.length) requested = data.rooms.map((l) => ({ ...l }));
  else if (Array.isArray(data.room_ids) && data.room_ids.length) requested = data.room_ids.map((id) => ({ room_id: id }));
  else if (data.room_id) requested = [{ room_id: data.room_id, nightly_rate: data.nightly_rate ?? data.price_per_night }];
  if (!requested.length) throw AppError.badRequest('Au moins une chambre est requise');

  const ids = requested.map((l) => String(l.room_id));
  if (new Set(ids).size !== ids.length) throw AppError.badRequest('Une chambre ne peut être ajoutée qu\'une seule fois');
  const rooms = await Room.find({ _id: { $in: ids } });
  if (rooms.length !== ids.length) throw AppError.notFound('Chambre non trouvée');
  const byId = Object.fromEntries(rooms.map((r) => [String(r._id), r]));

  const canOverride = can(user?.role, 'reservations.price_override');
  let overridden = false;
  const lines = requested.map((l) => {
    const room = byId[String(l.room_id)];
    let rate = room.base_price;
    const prev = existingLines.find((e) => String(e.room_id) === String(room._id));
    if (prev) rate = prev.nightly_rate;
    if (l.nightly_rate !== undefined && l.nightly_rate !== null && l.nightly_rate !== '') {
      const asked = Math.round(Number(l.nightly_rate));
      if (!(asked >= 0)) throw AppError.badRequest('Tarif invalide');
      if (asked !== rate) {
        if (!canOverride) throw AppError.forbidden('Vous n\'êtes pas autorisé à modifier manuellement le prix');
        rate = asked; overridden = true;
      }
    }
    if (prev && prev.nightly_rate !== room.base_price) overridden = true;
    return {
      room_id: room._id, room_number: room.room_number, nightly_rate: rate,
      adults_count: l.adults_count ?? 1, children_count: l.children_count ?? 0,
    };
  });
  return { lines, rooms, overridden };
};

const assertCapacity = (rooms, adults, children) => {
  const maxA = rooms.reduce((s, r) => s + (r.max_adults || 1), 0);
  const maxC = rooms.reduce((s, r) => s + (r.max_children ?? 0), 0);
  if (adults > maxA) throw AppError.badRequest(`Capacité dépassée : ${maxA} adulte(s) maximum pour la sélection`);
  if (adults + children > maxA + maxC) throw AppError.badRequest(`Capacité dépassée : ${maxA + maxC} personne(s) maximum pour la sélection`);
};

const applyPricing = async (reservation, { lines, arrival, departure, adults, discount_amount, discount_percent, apply_taxes }) => {
  const p = await computePricing({ lines, arrival, departure, discount_amount, discount_percent, apply_taxes, total_adults: adults });
  reservation.nights = p.nights;
  reservation.subtotal_amount = p.subtotal_amount;
  reservation.discount_amount = p.discount_amount;
  reservation.tax_amount = p.tax_amount;
  reservation.stay_tax_amount = p.stay_tax_amount;
  reservation.total_amount = p.total_amount;
  reservation.balance_amount = p.total_amount - (reservation.paid_amount || 0);
};

const setRoomStatus = async (roomIds, status) => {
  await Room.updateMany({ _id: { $in: roomIds }, status: { $nin: ['maintenance', 'blocked', 'out_of_order'] } }, { status });
};

const reservationService = {
  async createReservation(data, user) {
    const client = await Client.findById(data.client_id);
    if (!client) throw AppError.notFound('Client non trouvé');
    if (client.is_active === false) throw AppError.conflict('Ce client est désactivé');

    const arrival = toDay(data.arrival_date);
    const departure = toDay(data.departure_date);
    if (!arrival || !departure || departure <= arrival) throw AppError.badRequest("La date de départ doit être après la date d'arrivée");

    const adults = Number(data.adults_count ?? 1);
    const children = Number(data.children_count ?? 0);
    if (!(adults >= 1)) throw AppError.badRequest('Au moins un adulte est requis');

    const { lines, rooms, overridden } = await buildRoomLines(data, user);
    assertCapacity(rooms, adults, children);
    availability.assertRoomsBookable(rooms, arrival);
    await availability.assertNoConflict(rooms, arrival, departure);
    await assertSourceValid(data.source);

    const status = ['pending', 'confirmed'].includes(data.status) ? data.status : 'confirmed';
    const reservation = new Reservation({
      reservation_number: await nextNumber('reservation'),
      client_id: client._id,
      room_id: lines[0].room_id,
      rooms: lines,
      created_by: user?._id,
      arrival_date: arrival,
      departure_date: departure,
      adults_count: adults,
      children_count: children,
      guests: Array.isArray(data.guests) ? data.guests.filter((g) => g && g.full_name) : [],
      status,
      rate_type: overridden ? 'manual' : (data.rate_type || 'standard'),
      price_overridden: overridden,
      source: data.source || 'direct',
      discount_reason: data.discount_reason,
      special_requests: data.special_requests,
      notes: data.notes,
      total_amount: 0,
    });
    await applyPricing(reservation, {
      lines, arrival, departure, adults,
      discount_amount: data.discount_amount, discount_percent: data.discount_percent,
      apply_taxes: data.apply_taxes !== false,
    });
    reservation.apply_taxes = data.apply_taxes !== false;
    await reservation.save();

    if (data.initial_payment && Number(data.initial_payment.amount) > 0) {
      await paymentService.createPayment({ ...data.initial_payment, reservation_id: reservation._id }, user);
    }
    return load(reservation._id);
  },

  async getAllReservations(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.status) filter.status = { $in: String(query.status).split(',') };
    if (query.payment_status) filter.payment_status = { $in: String(query.payment_status).split(',') };
    if (query.source) filter.source = query.source;
    if (query.client_id) filter.client_id = query.client_id;
    if (query.room_id) filter.$or = [{ room_id: query.room_id }, { 'rooms.room_id': query.room_id }];
    if (query.from || query.to) {
      // Séjours qui touchent la période demandée
      if (query.to) filter.arrival_date = { $lte: toDay(query.to) };
      if (query.from) filter.departure_date = { $gte: toDay(query.from) };
    }
    if (query.arrival_date) filter.arrival_date = toDay(query.arrival_date);
    if (query.departure_date) filter.departure_date = toDay(query.departure_date);
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      const clients = await Client.find({ $or: [{ first_name: rx }, { last_name: rx }, { phone: rx }, { company: rx }] }).select('_id');
      const rooms = await Room.find({ room_number: rx }).select('_id');
      const or = [{ reservation_number: rx }, { client_id: { $in: clients.map((c) => c._id) } }];
      if (rooms.length) or.push({ room_id: { $in: rooms.map((r) => r._id) } });
      filter.$and = [...(filter.$and || []), { $or: or }];
    }
    const sortField = ['arrival_date', 'departure_date', 'createdAt', 'total_amount'].includes(query.sort) ? query.sort : 'arrival_date';
    const sortDir = query.order === 'asc' ? 1 : -1;
    const [reservations, total] = await Promise.all([
      populateOne(Reservation.find(filter)).sort({ [sortField]: sortDir, createdAt: -1 }).skip(skip).limit(limit),
      Reservation.countDocuments(filter),
    ]);
    return { reservations, total, page, limit };
  },

  async getReservationById(id) {
    const r = await load(id);
    const [payments, invoices] = await Promise.all([
      Payment.find({ reservation_id: id }).populate('processed_by', 'first_name last_name').sort({ payment_date: -1 }),
      Invoice.find({ reservation_id: id }).sort({ createdAt: -1 }),
    ]);
    const roomDocs = await Room.find({ _id: { $in: allRoomIds(r) } }).populate('room_type_id');
    return { ...r.toObject(), payments, invoices, room_details: roomDocs };
  },

  async updateReservation(id, data, user) {
    const reservation = await Reservation.findById(id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');

    // Les changements d'état passent par les actions dédiées (règles métier).
    if (data.status && data.status !== reservation.status) {
      const map = { cancelled: 'cancelReservation', checked_in: 'checkIn', checked_out: 'checkOut', no_show: 'markNoShow' };
      if (map[data.status]) return this[map[data.status]](id, data, user);
      if (!['pending', 'confirmed'].includes(data.status)) throw AppError.badRequest('Statut invalide');
      if (!['pending', 'confirmed'].includes(reservation.status)) throw AppError.conflict('Le statut de cette réservation ne peut plus être changé ainsi');
      reservation.status = data.status;
    }

    const st = reservation.status;
    if (['cancelled', 'checked_out', 'no_show'].includes(st)) {
      // Seules les notes restent modifiables sur un dossier clos.
      if (data.notes !== undefined) reservation.notes = data.notes;
      if (data.special_requests !== undefined) reservation.special_requests = data.special_requests;
      await reservation.save();
      return load(id);
    }

    const structural = ['arrival_date', 'departure_date', 'room_id', 'room_ids', 'rooms', 'adults_count', 'children_count',
      'discount_amount', 'discount_percent', 'apply_taxes', 'nightly_rate'].some((k) => data[k] !== undefined);

    if (data.client_id && String(data.client_id) !== String(reservation.client_id)) {
      const c = await Client.findById(data.client_id);
      if (!c) throw AppError.notFound('Client non trouvé');
      reservation.client_id = c._id;
    }
    if (data.source !== undefined) { await assertSourceValid(data.source); reservation.source = data.source; }
    for (const k of ['special_requests', 'notes', 'discount_reason']) if (data[k] !== undefined) reservation[k] = data[k];
    if (Array.isArray(data.guests)) reservation.guests = data.guests.filter((g) => g && g.full_name);

    if (structural) {
      const arrival = data.arrival_date ? toDay(data.arrival_date) : reservation.arrival_date;
      const departure = data.departure_date ? toDay(data.departure_date) : reservation.departure_date;
      if (departure <= arrival) throw AppError.badRequest("La date de départ doit être après la date d'arrivée");
      if (st === 'checked_in' && data.arrival_date && ymd(arrival) !== ymd(reservation.arrival_date)) {
        throw AppError.conflict("La date d'arrivée d'un séjour en cours ne peut pas être modifiée");
      }
      const adults = Number(data.adults_count ?? reservation.adults_count);
      const children = Number(data.children_count ?? reservation.children_count);

      const hasRoomChange = data.room_id || data.room_ids || data.rooms;
      if (st === 'checked_in' && hasRoomChange) throw AppError.conflict('Utilisez « changer de chambre » pour un séjour en cours');
      let lines; let rooms; let overridden = reservation.price_overridden;
      if (hasRoomChange || data.nightly_rate !== undefined) {
        const built = await buildRoomLines(hasRoomChange ? data : { room_id: reservation.room_id, nightly_rate: data.nightly_rate }, user, hasRoomChange ? [] : reservation.rooms);
        lines = built.lines; rooms = built.rooms; overridden = built.overridden;
      } else {
        lines = reservation.rooms.length ? reservation.rooms.map((l) => l.toObject()) : [{ room_id: reservation.room_id, nightly_rate: reservation.subtotal_amount / Math.max(reservation.nights, 1) }];
        rooms = await Room.find({ _id: { $in: lines.map((l) => l.room_id) } });
      }
      assertCapacity(rooms, adults, children);
      if (st !== 'checked_in') availability.assertRoomsBookable(rooms, arrival);
      await availability.assertNoConflict(rooms, arrival, departure, reservation._id);

      reservation.arrival_date = arrival;
      reservation.departure_date = departure;
      reservation.adults_count = adults;
      reservation.children_count = children;
      reservation.room_id = lines[0].room_id;
      reservation.rooms = lines;
      reservation.price_overridden = overridden;
      reservation.rate_type = overridden ? 'manual' : (data.rate_type || reservation.rate_type);
      if (data.apply_taxes !== undefined) reservation.apply_taxes = data.apply_taxes !== false;
      await applyPricing(reservation, {
        lines, arrival, departure, adults,
        discount_amount: data.discount_amount ?? reservation.discount_amount,
        discount_percent: data.discount_percent,
        apply_taxes: data.apply_taxes !== undefined ? data.apply_taxes !== false : reservation.apply_taxes !== false,
      });
    }
    await reservation.save();
    await paymentService.recomputeReservation(reservation._id);
    return load(id);
  },

  async changeRoom(id, { room_id, from_room_id, reason, nightly_rate, keep_rate }, user) {
    const reservation = await Reservation.findById(id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    if (!['pending', 'confirmed', 'checked_in'].includes(reservation.status)) throw AppError.conflict("Cette réservation n'est plus modifiable");
    if (!room_id) throw AppError.badRequest('La nouvelle chambre est requise');
    const newRoom = await Room.findById(room_id);
    if (!newRoom) throw AppError.notFound('Chambre non trouvée');

    const lines = reservation.rooms.length ? reservation.rooms.map((l) => l.toObject()) : [{ room_id: reservation.room_id, nightly_rate: reservation.subtotal_amount / Math.max(reservation.nights, 1), adults_count: reservation.adults_count, children_count: reservation.children_count }];
    const fromId = String(from_room_id || reservation.room_id);
    const idx = lines.findIndex((l) => String(l.room_id) === fromId);
    if (idx === -1) throw AppError.badRequest("La chambre d'origine ne fait pas partie de la réservation");
    if (fromId === String(newRoom._id)) throw AppError.badRequest('La nouvelle chambre est identique à la chambre actuelle');
    if (lines.some((l) => String(l.room_id) === String(newRoom._id))) throw AppError.badRequest('Cette chambre fait déjà partie de la réservation');

    availability.assertRoomsBookable([newRoom], reservation.status === 'checked_in' ? today() : reservation.arrival_date);
    await availability.assertNoConflict([newRoom], reservation.arrival_date, reservation.departure_date, reservation._id);
    if (reservation.status === 'checked_in' && ['cleaning'].includes(newRoom.status)) {
      throw AppError.conflict(`La chambre ${newRoom.room_number} doit d'abord être nettoyée`);
    }

    let rate = keep_rate ? lines[idx].nightly_rate : newRoom.base_price;
    let overridden = reservation.price_overridden;
    if (nightly_rate !== undefined && nightly_rate !== null && nightly_rate !== '' && Math.round(Number(nightly_rate)) !== rate) {
      if (!can(user?.role, 'reservations.price_override')) throw AppError.forbidden("Vous n'êtes pas autorisé à modifier manuellement le prix");
      rate = Math.round(Number(nightly_rate)); overridden = true;
    }
    if (keep_rate && rate !== newRoom.base_price) overridden = true;

    const oldRoomId = lines[idx].room_id;
    lines[idx] = { ...lines[idx], room_id: newRoom._id, room_number: newRoom.room_number, nightly_rate: rate };
    reservation.rooms = lines;
    if (String(reservation.room_id) === fromId) reservation.room_id = newRoom._id;
    reservation.price_overridden = overridden;
    reservation.notes = [reservation.notes, `Changement de chambre ${ymd(new Date())} : ${reason || 'sans motif'}`].filter(Boolean).join('\n');
    await applyPricing(reservation, {
      lines, arrival: reservation.arrival_date, departure: reservation.departure_date, adults: reservation.adults_count,
      discount_amount: reservation.discount_amount, apply_taxes: reservation.apply_taxes !== false,
    });
    await reservation.save();

    if (reservation.status === 'checked_in') {
      await setRoomStatus([newRoom._id], 'occupied');
      await Room.updateOne({ _id: oldRoomId, status: 'occupied' }, { status: 'cleaning' });
      await HousekeepingTask.create({ room_id: oldRoomId, task_type: 'cleaning', priority: 'high', status: 'pending', scheduled_date: new Date(), notes: 'Chambre libérée suite à un changement de chambre' });
    }
    await paymentService.recomputeReservation(reservation._id);
    return { reservation: await load(id), previous_room_id: oldRoomId, new_room_id: newRoom._id };
  },

  async checkIn(id, data = {}, user) {
    const reservation = await Reservation.findById(id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      throw AppError.conflict(reservation.status === 'checked_in' ? 'Le client est déjà en séjour (check-in effectué)' : `Check-in impossible : réservation ${reservation.status === 'cancelled' ? 'annulée' : 'clôturée'}`);
    }
    if (toDay(reservation.arrival_date) > today() && !data.allow_early) {
      throw AppError.conflict(`Check-in impossible avant la date d'arrivée prévue (${ymd(reservation.arrival_date)})`, 'CHECKIN_TOO_EARLY');
    }
    if (toDay(reservation.departure_date) <= today()) {
      throw AppError.conflict('La date de départ est déjà passée : modifiez les dates avant le check-in');
    }
    const roomIds = allRoomIds(reservation);
    const rooms = await Room.find({ _id: { $in: roomIds } });
    for (const room of rooms) {
      if (!room.is_active || ['maintenance', 'blocked', 'out_of_order'].includes(room.status)) throw AppError.conflict(`La chambre ${room.room_number} est indisponible`);
      if (room.status === 'cleaning') throw AppError.conflict(`La chambre ${room.room_number} est à nettoyer : elle doit être marquée propre avant le check-in`, 'ROOM_NOT_CLEAN');
      const occupant = await Reservation.findOne({ _id: { $ne: reservation._id }, status: 'checked_in', $or: [{ room_id: room._id }, { 'rooms.room_id': room._id }] });
      if (occupant) throw AppError.conflict(`La chambre ${room.room_number} est encore occupée (${occupant.reservation_number})`, 'ROOM_OCCUPIED');
    }
    if (Array.isArray(data.guests)) reservation.guests = data.guests.filter((g) => g && g.full_name);
    if (data.id_document_type || data.id_document_number) {
      await Client.updateOne({ _id: reservation.client_id }, { $set: { ...(data.id_document_type && { id_document_type: data.id_document_type }), ...(data.id_document_number && { id_document_number: data.id_document_number }) } });
    }
    reservation.status = 'checked_in';
    reservation.check_in_time = data.check_in_time ? new Date(data.check_in_time) : new Date();
    await reservation.save();
    await Room.updateMany({ _id: { $in: roomIds } }, { status: 'occupied' });
    await paymentService.recomputeReservation(reservation._id);
    return load(id);
  },

  async checkOut(id, data = {}, user) {
    const reservation = await Reservation.findById(id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    if (reservation.status !== 'checked_in') throw AppError.conflict('Le check-out nécessite un séjour en cours (check-in effectué)');

    if (data.payment && Number(data.payment.amount) > 0) {
      await paymentService.createPayment({ ...data.payment, reservation_id: reservation._id }, user);
    }
    const fresh = await Reservation.findById(id);
    if (fresh.balance_amount > 0 && !data.allow_unpaid) {
      const err = AppError.conflict(`Solde impayé : ${fresh.balance_amount} FCFA restent dus`, 'BALANCE_DUE');
      err.errors = [{ balance: fresh.balance_amount }];
      throw err;
    }
    fresh.status = 'checked_out';
    fresh.check_out_time = data.check_out_time ? new Date(data.check_out_time) : new Date();
    await fresh.save();

    const roomIds = allRoomIds(fresh);
    await Room.updateMany({ _id: { $in: roomIds } }, { status: 'cleaning' });
    const client = await Client.findById(fresh.client_id).select('first_name last_name');
    for (const roomId of roomIds) {
      await HousekeepingTask.create({
        room_id: roomId, task_type: 'cleaning', priority: 'high', status: 'pending', scheduled_date: new Date(),
        guest_name: client ? `${client.first_name} ${client.last_name}` : undefined, departure_time: fresh.check_out_time,
        notes: `Départ de ${fresh.reservation_number}`,
      });
    }
    try {
      const invoiceService = require('./invoiceService');
      const existing = await Invoice.findOne({ reservation_id: id, type: 'invoice', status: { $ne: 'cancelled' } });
      if (!existing) await invoiceService.createFromReservation(id, {}, user);
    } catch (e) { /* la facture peut être générée manuellement */ }
    return load(id);
  },

  async cancelReservation(id, data = {}, user) {
    const reservation = await Reservation.findById(id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    if (reservation.status === 'cancelled') throw AppError.conflict('Cette réservation est déjà annulée');
    if (!['pending', 'confirmed'].includes(reservation.status)) {
      throw AppError.conflict(reservation.status === 'checked_in' ? "Un séjour en cours ne peut pas être annulé : effectuez le check-out" : 'Cette réservation ne peut plus être annulée');
    }
    reservation.status = 'cancelled';
    reservation.cancelled_at = new Date();
    reservation.cancelled_by = user?._id;
    reservation.cancellation_reason = data.reason || data.cancellation_reason;
    await reservation.save();
    // Les chambres sont libérées : la disponibilité se calcule sur les statuts bloquants.
    await Invoice.updateMany({ reservation_id: id, status: { $in: ['draft', 'issued', 'sent', 'partially_paid'] } }, { status: 'cancelled', cancelled_at: new Date(), cancellation_reason: 'Réservation annulée' });
    await paymentService.recomputeReservation(reservation._id);
    const out = await load(id);
    return out;
  },

  async markNoShow(id, data = {}, user) {
    const reservation = await Reservation.findById(id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    if (!['pending', 'confirmed'].includes(reservation.status)) throw AppError.conflict('Seule une réservation non arrivée peut être marquée no-show');
    if (toDay(reservation.arrival_date) > today()) throw AppError.conflict("Le client n'est pas encore attendu (arrivée future)");
    reservation.status = 'no_show';
    reservation.cancellation_reason = data.reason || 'No-show';
    await reservation.save();
    return load(id);
  },

  async getReservationsByDate(date) {
    const d = toDay(date || new Date());
    return populateOne(Reservation.find({ arrival_date: { $lte: d }, departure_date: { $gt: d }, status: { $in: ['pending', 'confirmed', 'checked_in'] } })).sort({ arrival_date: 1 });
  },

  async getReservationsByDateRange(start, end) {
    if (!start || !end) throw AppError.badRequest('Dates de début et de fin requises');
    return populateOne(Reservation.find({ arrival_date: { $lt: toDay(end) }, departure_date: { $gt: toDay(start) } })).sort({ arrival_date: 1 });
  },

  async getReservationsByStatus(status) {
    if (!status) throw AppError.badRequest('Statut requis');
    return populateOne(Reservation.find({ status })).sort({ arrival_date: -1 });
  },

  async getReservationHistory(id) {
    const { HistoryLog } = require('../models');
    await load(id);
    return HistoryLog.find({ entity_type: 'reservation', entity_id: id }).sort({ createdAt: -1 });
  },

  async getArrivalsAndDepartures(date) {
    const d = toDay(date || new Date());
    const [arrivals, departures, inHouse] = await Promise.all([
      populateOne(Reservation.find({ arrival_date: d, status: { $in: ['pending', 'confirmed', 'checked_in'] } })).sort({ createdAt: 1 }),
      populateOne(Reservation.find({ departure_date: d, status: { $in: ['checked_in', 'checked_out'] } })).sort({ createdAt: 1 }),
      populateOne(Reservation.find({ status: 'checked_in' })).sort({ departure_date: 1 }),
    ]);
    return { arrivals, departures, in_house: inHouse };
  },
};

module.exports = reservationService;
