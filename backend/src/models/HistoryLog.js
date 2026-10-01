const mongoose = require('mongoose');

const historyLogSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  user_name: { type: String, trim: true },
  entity_type: { type: String, required: true, trim: true },
  entity_id: { type: mongoose.Schema.Types.ObjectId },
  action: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  ip_address: { type: String, trim: true },
}, { timestamps: true, collection: 'history_logs' });

historyLogSchema.index({ user_id: 1 });
historyLogSchema.index({ entity_type: 1, entity_id: 1 });
historyLogSchema.index({ action: 1 });
historyLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HistoryLog', historyLogSchema);
