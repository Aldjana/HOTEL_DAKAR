const { Invoice, InvoiceItem, Reservation, Client, Payment } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination, escapeRegex } = require('../utils/pagination');
const { toDay, addDays, ymd } = require('../utils/dates');
const { nextNumber } = require('./numberingService');
const settingsService = require('./settingsService');
const paymentService = require('./paymentService');

const OPEN = ['draft', 'issued', 'sent', 'partially_paid', 'overdue'];

const statusFor = (invoice, paid) => {
  if (['cancelled', 'draft'].includes(invoice.status) || invoice.type === 'proforma') return invoice.status;
  if (paid >= invoice.total_amount && invoice.total_amount > 0) return 'paid';
  if (paid > 0) return 'partially_paid';
  if (invoice.status === 'paid' || invoice.status === 'partially_paid') return 'issued';
  if (invoice.due_date && invoice.due_date < toDay(new Date()) && invoice.status !== 'draft') return 'overdue';
  return invoice.status;
};

const shape = (inv) => {
  const o = inv.toObject ? inv.toObject() : inv;
  return { ...o, client: o.client_id, reservation: o.reservation_id, balance_amount: Math.max((o.total_amount || 0) - (o.paid_amount || 0), 0) };
};

const populate = (q) => q.populate('client_id', 'first_name last_name email phone company address').populate('reservation_id', 'reservation_number arrival_date departure_date nights status payment_status total_amount paid_amount balance_amount');

const buildItemsFromReservation = async (reservation) => {
  const { Room } = require('../models');
  const lines = reservation.rooms?.length ? reservation.rooms : [{ room_id: reservation.room_id, nightly_rate: reservation.subtotal_amount / Math.max(reservation.nights, 1) }];
  const rooms = await Room.find({ _id: { $in: lines.map((l) => l.room_id) } }).populate('room_type_id');
  const byId = Object.fromEntries(rooms.map((r) => [String(r._id), r]));
  const items = lines.map((l) => {
    const room = byId[String(l.room_id)];
    return {
      description: `Chambre ${room?.room_number || l.room_number || ''}${room?.room_type_id?.name ? ` (${room.room_type_id.name})` : ''} — ${ymd(reservation.arrival_date)} au ${ymd(reservation.departure_date)}`,
      quantity: reservation.nights, unit_price: l.nightly_rate, total_price: l.nightly_rate * reservation.nights, item_type: 'room',
    };
  });
  if (reservation.stay_tax_amount > 0) {
    items.push({ description: 'Taxe de séjour', quantity: 1, unit_price: reservation.stay_tax_amount, total_price: reservation.stay_tax_amount, item_type: 'extra' });
  }
  return items;
};

const invoiceService = {
  async createFromReservation(reservationId, data = {}, user) {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    const type = data.type === 'proforma' ? 'proforma' : 'invoice';
    if (type === 'invoice') {
      if (reservation.status === 'cancelled') throw AppError.conflict("Impossible de facturer une réservation annulée");
      const existing = await Invoice.findOne({ reservation_id: reservationId, type: 'invoice', status: { $ne: 'cancelled' } });
      if (existing) throw AppError.conflict(`La facture ${existing.invoice_number} existe déjà pour cette réservation. Annulez-la pour en émettre une nouvelle.`, 'INVOICE_EXISTS');
    }
    const items = await buildItemsFromReservation(reservation);
    const subtotal = items.reduce((s, i) => s + i.total_price, 0);
    const invoice = await Invoice.create({
      invoice_number: await nextNumber(type === 'proforma' ? 'proforma' : 'invoice'),
      type,
      reservation_id: reservation._id,
      client_id: reservation.client_id,
      issued_by: user?._id,
      issue_date: new Date(),
      due_date: data.due_date ? new Date(data.due_date) : (type === 'invoice' ? reservation.departure_date : undefined),
      subtotal,
      discount_amount: reservation.discount_amount || 0,
      tax_amount: reservation.tax_amount || 0,
      total_amount: reservation.total_amount,
      paid_amount: type === 'invoice' ? Math.min(Math.max(reservation.paid_amount || 0, 0), reservation.total_amount) : 0,
      status: type === 'proforma' ? 'issued' : 'issued',
      notes: data.notes,
    });
    await InvoiceItem.insertMany(items.map((i) => ({ ...i, invoice_id: invoice._id })));
    invoice.status = statusFor(invoice, invoice.paid_amount);
    await invoice.save();
    return this.getInvoiceById(invoice._id);
  },

  async createInvoice(data, user) {
    if (!data.reservation_id) throw AppError.badRequest('La réservation est requise');
    if (!Array.isArray(data.items) || !data.items.length) return this.createFromReservation(data.reservation_id, data, user);
    // Facture personnalisée (lignes libres)
    const reservation = await Reservation.findById(data.reservation_id);
    if (!reservation) throw AppError.notFound('Réservation non trouvée');
    const items = data.items.map((i) => {
      const q = Number(i.quantity ?? 1); const p = Number(i.unit_price);
      if (!i.description || !(q > 0) || !(p >= 0)) throw AppError.badRequest('Ligne de facture invalide');
      return { description: i.description, quantity: q, unit_price: p, total_price: Math.round(q * p), item_type: i.item_type || 'service' };
    });
    const settings = await settingsService.getHotelSettings();
    const subtotal = items.reduce((s, i) => s + i.total_price, 0);
    const discount = Math.round(Number(data.discount_amount || 0));
    const tax = Math.round(((subtotal - discount) * (data.apply_taxes === false ? 0 : settings.vat_rate || 0)) / 100);
    const type = data.type === 'proforma' ? 'proforma' : 'invoice';
    const invoice = await Invoice.create({
      invoice_number: await nextNumber(type === 'proforma' ? 'proforma' : 'invoice'), type,
      reservation_id: reservation._id, client_id: reservation.client_id, issued_by: user?._id,
      due_date: data.due_date ? new Date(data.due_date) : undefined,
      subtotal, discount_amount: discount, tax_amount: tax, total_amount: subtotal - discount + tax, paid_amount: 0, status: 'issued', notes: data.notes,
    });
    await InvoiceItem.insertMany(items.map((i) => ({ ...i, invoice_id: invoice._id })));
    return this.getInvoiceById(invoice._id);
  },

  async getAllInvoices(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    for (const k of ['status', 'type', 'client_id', 'reservation_id']) if (query[k]) filter[k] = query[k];
    if (query.from || query.to) {
      filter.issue_date = {};
      if (query.from) filter.issue_date.$gte = toDay(query.from);
      if (query.to) filter.issue_date.$lt = addDays(toDay(query.to), 1);
    }
    if (query.search) {
      const rx = new RegExp(escapeRegex(query.search.trim()), 'i');
      const clients = await Client.find({ $or: [{ first_name: rx }, { last_name: rx }] }).select('_id');
      const reservations = await Reservation.find({ reservation_number: rx }).select('_id');
      filter.$or = [{ invoice_number: rx }, { client_id: { $in: clients.map((c) => c._id) } }, { reservation_id: { $in: reservations.map((r) => r._id) } }];
    }
    const [invoices, total] = await Promise.all([
      populate(Invoice.find(filter)).sort({ issue_date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Invoice.countDocuments(filter),
    ]);
    return { invoices: invoices.map(shape), total, page, limit };
  },

  async getInvoiceById(id) {
    const invoice = await populate(Invoice.findById(id));
    if (!invoice) throw AppError.notFound('Facture non trouvée');
    const [items, payments] = await Promise.all([
      InvoiceItem.find({ invoice_id: id }).sort({ createdAt: 1 }),
      Payment.find({ reservation_id: invoice.reservation_id?._id || invoice.reservation_id, payment_status: { $in: ['completed', 'refunded'] } }).sort({ payment_date: 1 }),
    ]);
    return { ...shape(invoice), items, payments };
  },

  async updateInvoice(id, data) {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw AppError.notFound('Facture non trouvée');
    if (invoice.status === 'cancelled') throw AppError.conflict('Une facture annulée ne peut plus être modifiée');
    if (data.notes !== undefined) invoice.notes = data.notes;
    if (data.due_date !== undefined) invoice.due_date = data.due_date ? new Date(data.due_date) : undefined;
    if (data.status === 'cancelled') {
      if (invoice.paid_amount > 0) throw AppError.conflict('Cette facture a des paiements : remboursez ou corrigez les paiements avant de l\'annuler');
      invoice.status = 'cancelled'; invoice.cancelled_at = new Date(); invoice.cancellation_reason = data.cancellation_reason || data.reason;
    } else if (data.status === 'issued' && invoice.status === 'draft') invoice.status = 'issued';
    await invoice.save();
    return this.getInvoiceById(id);
  },

  async deleteInvoice(id) {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw AppError.notFound('Facture non trouvée');
    if (invoice.type === 'invoice' && invoice.status !== 'draft') {
      throw AppError.conflict("Une facture émise ne peut pas être supprimée (numérotation continue) : annulez-la à la place");
    }
    await InvoiceItem.deleteMany({ invoice_id: id });
    await Invoice.deleteOne({ _id: id });
    return { message: 'Facture supprimée avec succès', invoice_number: invoice.invoice_number };
  },

  async markSent(id) {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw AppError.notFound('Facture non trouvée');
    if (['cancelled', 'paid'].includes(invoice.status)) throw AppError.conflict(`Une facture ${invoice.status === 'paid' ? 'payée' : 'annulée'} ne peut pas être marquée comme envoyée`);
    invoice.status = invoice.status === 'partially_paid' ? 'partially_paid' : 'sent';
    await invoice.save();
    return this.getInvoiceById(id);
  },

  // Encaisse le solde de la facture via un vrai paiement (traçabilité comptable et caisse)
  async markPaid(id, data = {}, user) {
    const invoice = await Invoice.findById(id);
    if (!invoice) throw AppError.notFound('Facture non trouvée');
    if (invoice.type === 'proforma') throw AppError.conflict('Une proforma ne peut pas être payée');
    if (invoice.status === 'cancelled') throw AppError.conflict('Facture annulée');
    const reservation = await Reservation.findById(invoice.reservation_id);
    const due = Math.max(reservation.total_amount - (reservation.paid_amount || 0), 0);
    if (due > 0) {
      if (!data.payment_method) throw AppError.badRequest('Le mode de paiement est requis pour encaisser le solde');
      await paymentService.createPayment({ reservation_id: reservation._id, amount: due, payment_method: data.payment_method, reference: data.reference, description: `Règlement facture ${invoice.invoice_number}` }, user);
    }
    return this.getInvoiceById(id);
  },

  async getInvoicesByReservation(reservationId) {
    return (await populate(Invoice.find({ reservation_id: reservationId })).sort({ createdAt: -1 })).map(shape);
  },
  async getInvoicesByClient(clientId) {
    return (await populate(Invoice.find({ client_id: clientId })).sort({ createdAt: -1 })).map(shape);
  },
  async getInvoicesByDateRange(start, end) {
    if (!start || !end) throw AppError.badRequest('Dates de début et de fin requises');
    return (await populate(Invoice.find({ issue_date: { $gte: toDay(start), $lt: addDays(toDay(end), 1) } })).sort({ issue_date: -1 })).map(shape);
  },

  async syncWithReservation(reservation) {
    const invoices = await Invoice.find({ reservation_id: reservation._id, type: 'invoice', status: { $in: OPEN.concat(['paid']) } });
    for (const inv of invoices) {
      inv.paid_amount = Math.min(Math.max(reservation.paid_amount || 0, 0), inv.total_amount);
      inv.status = statusFor(inv, inv.paid_amount);
      await inv.save();
    }
  },
};

module.exports = invoiceService;
