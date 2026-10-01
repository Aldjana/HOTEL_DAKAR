const mongoose = require('mongoose');

const CLIENT_TYPES = ['individual', 'company', 'agency', 'ngo', 'diaspora', 'tourist', 'local', 'other'];

const clientSchema = new mongoose.Schema({
  first_name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  last_name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  client_type: { type: String, enum: CLIENT_TYPES, default: 'individual' },
  company: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  nationality: { type: String, trim: true },
  id_document_type: { type: String, enum: ['passport', 'id_card', 'driver_license', 'other'] },
  id_document_number: { type: String, trim: true },
  is_vip: { type: Boolean, default: false },
  is_active: { type: Boolean, default: true },
  notes: { type: String, trim: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'clients' });

clientSchema.index({ phone: 1 });
clientSchema.index({ email: 1 });
clientSchema.index({ last_name: 1, first_name: 1 });
clientSchema.index({ is_vip: 1 });

const Client = mongoose.model('Client', clientSchema);
Client.CLIENT_TYPES = CLIENT_TYPES;
module.exports = Client;
