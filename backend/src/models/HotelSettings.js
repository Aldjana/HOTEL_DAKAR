const mongoose = require('mongoose');

const hotelSettingsSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'Mon Hôtel' },
  logo_url: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  ninea: { type: String, default: '' },
  rccm: { type: String, default: '' },
  currency: { type: String, default: 'FCFA' },
  check_in_time: { type: String, default: '14:00' },
  check_out_time: { type: String, default: '12:00' },
  stay_tax: { type: Number, default: 0, min: 0 },
  vat_rate: { type: Number, default: 0, min: 0, max: 100 },
  cancellation_hours: { type: Number, default: 48 },
  conditions: { type: String, default: '' },
  legal_mentions: { type: String, default: '' },
  invoice_footer: { type: String, default: '' },
  reservation_sources: { type: [String], default: [] },
  cash_notes: { type: String, default: '' },
  cash_closed_at: { type: Date },
}, { timestamps: true, collection: 'hotel_settings' });

module.exports = mongoose.model('HotelSettings', hotelSettingsSchema);
