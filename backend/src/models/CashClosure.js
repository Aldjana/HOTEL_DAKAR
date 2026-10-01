const mongoose = require('mongoose');

const cashClosureSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // YYYY-MM-DD
  closed_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totals_by_method: { type: mongoose.Schema.Types.Mixed, default: {} },
  total_in: { type: Number, default: 0 },
  total_refunds: { type: Number, default: 0 },
  net_total: { type: Number, default: 0 },
  expected_cash: { type: Number, default: 0 },
  counted_cash: { type: Number },
  difference: { type: Number, default: 0 },
  payments_count: { type: Number, default: 0 },
  notes: { type: String, trim: true },
  closed_at: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'cash_closures' });

module.exports = mongoose.model('CashClosure', cashClosureSchema);
