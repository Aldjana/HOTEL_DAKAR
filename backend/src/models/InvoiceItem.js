const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema({
  invoice_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  quantity: {
    type: Number,
    default: 1,
  },
  unit_price: {
    type: Number,
    required: true,
  },
  total_price: {
    type: Number,
    required: true,
  },
  item_type: {
    type: String,
    enum: ['room', 'service', 'extra', 'penalty', 'discount'],
    default: 'service',
  },
}, {
  timestamps: true,
  collection: 'invoice_items',
});

invoiceItemSchema.index({ invoice_id: 1 });

const InvoiceItem = mongoose.model('InvoiceItem', invoiceItemSchema);

module.exports = InvoiceItem;
