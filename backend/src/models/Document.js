const mongoose = require('mongoose');

// Historique des documents générés (factures, proformas, reçus, résumés, rapports de caisse…)
const documentSchema = new mongoose.Schema({
  reservation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Reservation' },
  client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  ref_id: { type: mongoose.Schema.Types.ObjectId },
  document_type: {
    type: String,
    enum: ['id_card', 'passport', 'contract', 'invoice', 'proforma', 'receipt', 'reservation_summary', 'cash_report', 'other'],
    default: 'other',
  },
  number: { type: String, trim: true },
  file_name: { type: String, required: true, trim: true },
  file_url: { type: String, trim: true },
  file_size: { type: Number },
  mime_type: { type: String, trim: true },
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true, collection: 'documents' });

documentSchema.index({ reservation_id: 1 });
documentSchema.index({ document_type: 1 });
documentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);
