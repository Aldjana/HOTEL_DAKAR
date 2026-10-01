const mongoose = require('mongoose');

const PAYMENT_METHODS = ['cash', 'wave', 'orange_money', 'free_money', 'mobile_money', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'ota', 'other'];

const paymentSchema = new mongoose.Schema({
  reservation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  processed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transaction_id: { type: String, unique: true, sparse: true, trim: true },
  receipt_number: { type: String, trim: true },
  type: { type: String, enum: ['payment', 'refund'], default: 'payment' },
  amount: { type: Number, required: true, min: 0 },
  // Les modes valides sont ceux de la collection payment_modes (configurable) ; validés dans le service.
  payment_method: { type: String, required: true, trim: true },
  refund_of: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  payment_status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded', 'voided'], default: 'completed' },
  payment_date: { type: Date, default: Date.now },
  description: { type: String, trim: true },
  reference: { type: String, trim: true },
  // Traçabilité des corrections / annulations (CDC : correction ou suppression tracée)
  voided_at: { type: Date },
  voided_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  void_reason: { type: String, trim: true },
  corrections: [{
    _id: false,
    at: { type: Date, default: Date.now },
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    before: { type: mongoose.Schema.Types.Mixed },
  }],
}, { timestamps: true, collection: 'payments' });

paymentSchema.index({ reservation_id: 1 });
paymentSchema.index({ client_id: 1 });
paymentSchema.index({ payment_status: 1 });
paymentSchema.index({ payment_date: 1 });
paymentSchema.index({ payment_method: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
Payment.PAYMENT_METHODS = PAYMENT_METHODS;
module.exports = Payment;
