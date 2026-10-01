const mongoose = require('mongoose');

const reservationSourceSchema = new mongoose.Schema({
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
  commission_rate: {
    type: Number,
    default: 0,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  collection: 'reservation_sources',
});

reservationSourceSchema.index({ is_active: 1 });

const ReservationSource = mongoose.model('ReservationSource', reservationSourceSchema);

module.exports = ReservationSource;
