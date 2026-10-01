const mongoose = require('mongoose');

const RESERVATION_STATUSES = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'];
const RESERVATION_PAYMENT_STATUSES = ['unpaid', 'deposit', 'partial', 'paid', 'refunded'];
// Statuts qui bloquent une chambre sur ses dates.
const BLOCKING_STATUSES = ['pending', 'confirmed', 'checked_in'];

const roomLineSchema = new mongoose.Schema({
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  room_number: { type: String },
  nightly_rate: { type: Number, required: true, min: 0 },
  adults_count: { type: Number, default: 1 },
  children_count: { type: Number, default: 0 },
}, { _id: false });

const guestSchema = new mongoose.Schema({
  full_name: { type: String, trim: true, required: true },
  id_document_number: { type: String, trim: true },
  is_child: { type: Boolean, default: false },
}, { _id: false });

const reservationSchema = new mongoose.Schema({
  reservation_number: { type: String, required: true, unique: true, trim: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  // Chambre principale (compatibilité) + liste complète pour les réservations multi-chambres.
  room_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  rooms: { type: [roomLineSchema], default: [] },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  arrival_date: { type: Date, required: true },
  departure_date: { type: Date, required: true },
  nights: { type: Number, default: 1 },
  adults_count: { type: Number, default: 1, min: 1 },
  children_count: { type: Number, default: 0, min: 0 },
  guests: { type: [guestSchema], default: [] },
  status: { type: String, enum: RESERVATION_STATUSES, default: 'confirmed' },
  payment_status: { type: String, enum: RESERVATION_PAYMENT_STATUSES, default: 'unpaid' },
  rate_type: { type: String, enum: ['standard', 'weekend', 'holiday', 'promo', 'manual'], default: 'standard' },
  apply_taxes: { type: Boolean, default: true },
  price_overridden: { type: Boolean, default: false },
  subtotal_amount: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  discount_reason: { type: String, trim: true },
  tax_amount: { type: Number, default: 0 },
  stay_tax_amount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true, min: 0 },
  paid_amount: { type: Number, default: 0 },
  balance_amount: { type: Number, default: 0 },
  source: { type: String, trim: true, default: 'direct' },
  special_requests: { type: String, trim: true },
  notes: { type: String, trim: true },
  check_in_time: { type: Date },
  check_out_time: { type: Date },
  cancelled_at: { type: Date },
  cancelled_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cancellation_reason: { type: String, trim: true },
}, { timestamps: true, collection: 'reservations' });

reservationSchema.index({ client_id: 1 });
reservationSchema.index({ room_id: 1 });
reservationSchema.index({ 'rooms.room_id': 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ arrival_date: 1 });
reservationSchema.index({ departure_date: 1 });

const Reservation = mongoose.model('Reservation', reservationSchema);
Reservation.RESERVATION_STATUSES = RESERVATION_STATUSES;
Reservation.BLOCKING_STATUSES = BLOCKING_STATUSES;
module.exports = Reservation;
