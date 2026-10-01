const { Client, Reservation, Payment, Invoice } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, escapeRegex } = require('../utils/pagination');

const FIELDS = ['first_name', 'last_name', 'client_type', 'company', 'email', 'phone', 'address', 'city', 'nationality',
  'id_document_type', 'id_document_number', 'is_vip', 'is_active', 'notes'];

const pick = (data) => Object.fromEntries(FIELDS.filter((k) => data[k] !== undefined).map((k) => [k, data[k] === '' ? undefined : data[k]]));

// Statistiques de séjour : nombre de séjours, dernier séjour, total dépensé, client récurrent (≥ 2 séjours)
const withStats = async (clients) => {
  const ids = clients.map((c) => c._id);
  const reservations = await Reservation.find({ client_id: { $in: ids }, status: { $ne: 'cancelled' } })
    .select('client_id status arrival_date departure_date paid_amount total_amount').lean();
  const map = {};
  reservations.forEach((r) => {
    const k = String(r.client_id);
    map[k] = map[k] || { stays: 0, spent: 0, last: null };
    if (['checked_in', 'checked_out'].includes(r.status)) map[k].stays += 1;
    map[k].spent += r.paid_amount || 0;
    if (!map[k].last || r.arrival_date > map[k].last) map[k].last = r.arrival_date;
  });
  return clients.map((c) => {
    const s = map[String(c._id)] || { stays: 0, spent: 0, last: null };
    return { ...c.toObject(), reservations_count: s.stays, total_spent: s.spent, last_stay: s.last, is_recurring: s.stays >= 2 };
  });
};

const clientService = {
  async createClient(data, user) {
    const clean = pick(data);
    if (!data.force) {
      const or = [];
      if (clean.email) or.push({ email: String(clean.email).toLowerCase() });
      if (clean.phone) or.push({ phone: clean.phone });
      if (or.length) {
        const dup = await Client.findOne({ $or: or });
        if (dup) {
          const err = AppError.conflict(`Un client avec le même ${dup.email === clean.email?.toLowerCase() ? 'email' : 'téléphone'} existe déjà : ${dup.first_name} ${dup.last_name}`, 'DUPLICATE_CLIENT');
          err.errors = [{ client_id: dup._id, name: `${dup.first_name} ${dup.last_name}` }];
          throw err;
        }
      }
    }
    return Client.create({ ...clean, created_by: user?._id });
  },

  async getAllClients(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ first_name: rx }, { last_name: rx }, { email: rx }, { phone: rx }, { company: rx }];
    }
    if (query.client_type) filter.client_type = query.client_type;
    if (query.is_vip !== undefined && query.is_vip !== '') filter.is_vip = String(query.is_vip) === 'true';
    if (query.is_active !== undefined && query.is_active !== '') filter.is_active = String(query.is_active) === 'true';
    else if (!query.include_inactive) filter.is_active = { $ne: false };
    const [found, total] = await Promise.all([
      Client.find(filter).sort({ last_name: 1, first_name: 1 }).skip(skip).limit(limit),
      Client.countDocuments(filter),
    ]);
    let clients = await withStats(found);
    if (query.recurring === 'true') clients = clients.filter((c) => c.is_recurring);
    return { clients, total, page, limit };
  },

  async searchClients(term) {
    if (!term || !String(term).trim()) return [];
    const rx = new RegExp(escapeRegex(String(term).trim()), 'i');
    return Client.find({ is_active: { $ne: false }, $or: [{ first_name: rx }, { last_name: rx }, { email: rx }, { phone: rx }, { company: rx }] })
      .sort({ last_name: 1 }).limit(20);
  },

  async getClientById(id) {
    const client = await Client.findById(id);
    if (!client) throw AppError.notFound('Client non trouvé');
    const [withS] = await withStats([client]);
    return withS;
  },

  async updateClient(id, data) {
    const client = await Client.findById(id);
    if (!client) throw AppError.notFound('Client non trouvé');
    Object.assign(client, pick(data));
    await client.save();
    return this.getClientById(id);
  },

  async deleteClient(id) {
    const client = await Client.findById(id);
    if (!client) throw AppError.notFound('Client non trouvé');
    const count = await Reservation.countDocuments({ client_id: id });
    if (count > 0) {
      client.is_active = false;
      await client.save();
      return { deleted: false, deactivated: true, message: `Ce client a ${count} réservation(s) : il a été désactivé (historique conservé)` };
    }
    await Client.deleteOne({ _id: id });
    return { deleted: true, deactivated: false, message: 'Client supprimé avec succès' };
  },

  async getClientReservations(id) {
    if (!(await Client.exists({ _id: id }))) throw AppError.notFound('Client non trouvé');
    return Reservation.find({ client_id: id }).populate({ path: 'room_id', populate: { path: 'room_type_id' } }).sort({ arrival_date: -1 });
  },

  async getClientHistory(id) {
    const client = await Client.findById(id);
    if (!client) throw AppError.notFound('Client non trouvé');
    const reservations = await Reservation.find({ client_id: id }).populate({ path: 'room_id', populate: { path: 'room_type_id' } }).sort({ arrival_date: -1 });
    const [payments, invoices] = await Promise.all([
      Payment.find({ client_id: id, payment_status: { $ne: 'voided' } }).sort({ payment_date: -1 }),
      Invoice.find({ client_id: id }).sort({ issue_date: -1 }),
    ]);
    const done = reservations.filter((r) => r.status !== 'cancelled');
    return {
      client, reservations, payments, invoices,
      summary: {
        stays: done.filter((r) => ['checked_in', 'checked_out'].includes(r.status)).length,
        total_billed: done.reduce((s, r) => s + r.total_amount, 0),
        total_paid: done.reduce((s, r) => s + (r.paid_amount || 0), 0),
        balance_due: done.reduce((s, r) => s + Math.max(r.balance_amount || 0, 0), 0),
      },
    };
  },
};

module.exports = clientService;
