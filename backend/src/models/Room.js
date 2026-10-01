const mongoose = require('mongoose');

const ROOM_STATUSES = ['available', 'reserved', 'occupied', 'cleaning', 'clean', 'maintenance', 'blocked', 'out_of_order'];

const roomSchema = new mongoose.Schema({
  room_number: { type: String, required: true, unique: true, trim: true },
  room_type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'RoomType', required: true },
  floor: { type: Number },
  status: { type: String, enum: ROOM_STATUSES, default: 'available' },
  is_active: { type: Boolean, default: true },
  view: { type: String, trim: true },
  max_adults: { type: Number, default: 2, min: 1 },
  max_children: { type: Number, default: 1, min: 0 },
  base_price: { type: Number, required: true, min: 0 },
  amenities: { type: [String], default: [] },
  image_url: { type: String, trim: true },
  notes: { type: String, trim: true },
}, { timestamps: true, collection: 'rooms' });

roomSchema.index({ room_type_id: 1 });
roomSchema.index({ status: 1 });

roomSchema.virtual('room_type', {
  ref: 'RoomType', localField: 'room_type_id', foreignField: '_id', justOne: true,
});
roomSchema.set('toJSON', { virtuals: true });
roomSchema.set('toObject', { virtuals: true });

const Room = mongoose.model('Room', roomSchema);
Room.ROOM_STATUSES = ROOM_STATUSES;
module.exports = Room;
