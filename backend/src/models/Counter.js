const mongoose = require('mongoose');

// Compteurs atomiques pour les numéros séquentiels (RES-2026-000001, FAC-2026-000001…)
const counterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
}, { collection: 'counters' });

counterSchema.statics.next = async function next(key) {
  const doc = await this.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
