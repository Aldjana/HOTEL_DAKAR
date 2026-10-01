const mongoose = require('mongoose');

const paymentModeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  requires_reference: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
  collection: 'payment_modes',
});

paymentModeSchema.index({ is_active: 1 });

const PaymentMode = mongoose.model('PaymentMode', paymentModeSchema);

module.exports = PaymentMode;
