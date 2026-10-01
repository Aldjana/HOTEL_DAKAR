const mongoose = require('mongoose');

const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  description: { type: String, trim: true },
  base_price: { type: Number, required: true, min: 0 },
  capacity_adults: { type: Number, default: 2 },
  capacity_children: { type: Number, default: 1 },
  size_sqm: { type: Number },
  amenities: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
}, { timestamps: true, collection: 'room_types' });

roomTypeSchema.index({ is_active: 1 });
module.exports = mongoose.model('RoomType', roomTypeSchema);
