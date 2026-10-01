const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoice_number: { type: String, required: true, unique: true, trim: true },
  type: { type: String, enum: ['invoice', 'proforma'], default: 'invoice' },
  reservation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation', required: true },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
  issued_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  issue_date: { type: Date, default: Date.now },
  due_date: { type: Date },
  subtotal: { type: Number, required: true },
  tax_amount: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  total_amount: { type: Number, required: true },
  paid_amount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'issued', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'],
    default: 'issued',
  },
  notes: { type: String, trim: true },
  cancelled_at: { type: Date },
  cancellation_reason: { type: String, trim: true },
}, { timestamps: true, collection: 'invoices' });

invoiceSchema.index({ reservation_id: 1 });
invoiceSchema.index({ client_id: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issue_date: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
