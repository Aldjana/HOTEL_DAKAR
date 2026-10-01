const { Document } = require('../models');
const AppError = require('../utils/AppError');
const { parsePagination } = require('../utils/pagination');
const { toDay, addDays } = require('../utils/dates');

// Historique des documents générés (PDF). Les fichiers sont régénérés à la demande depuis les données de référence.
const documentService = {
  async getAllDocuments(query = {}) {
    const { page, limit, skip } = parsePagination(query);
    const filter = {};
    if (query.document_type) filter.document_type = query.document_type;
    if (query.reservation_id) filter.reservation_id = query.reservation_id;
    if (query.client_id) filter.client_id = query.client_id;
    if (query.from || query.to) {
      filter.createdAt = {};
      if (query.from) filter.createdAt.$gte = toDay(query.from);
      if (query.to) filter.createdAt.$lt = addDays(toDay(query.to), 1);
    }
    const [documents, total] = await Promise.all([
      Document.find(filter).populate('uploaded_by', 'first_name last_name').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Document.countDocuments(filter),
    ]);
    return { documents, total, page, limit };
  },
  async getDocumentById(id) {
    const d = await Document.findById(id).populate('uploaded_by', 'first_name last_name');
    if (!d) throw AppError.notFound('Document non trouvé');
    return d;
  },
  async getDocumentsByReservation(reservationId) {
    return Document.find({ reservation_id: reservationId }).populate('uploaded_by', 'first_name last_name').sort({ createdAt: -1 });
  },
  async deleteDocument(id) {
    const d = await Document.findByIdAndDelete(id);
    if (!d) throw AppError.notFound('Document non trouvé');
    return { message: 'Document supprimé de l\'historique' };
  },
  async regenerate(id, user) {
    const pdf = require('./pdfService');
    const d = await this.getDocumentById(id);
    if (!d.ref_id) throw AppError.conflict('Ce document ne peut pas être régénéré (rapport ponctuel)');
    if (d.document_type === 'invoice' || d.document_type === 'proforma') return pdf.invoice(d.ref_id, user);
    if (d.document_type === 'receipt') return pdf.receipt(d.ref_id, user);
    if (d.document_type === 'reservation_summary') return pdf.reservationSummary(d.ref_id, user);
    throw AppError.conflict('Ce type de document ne peut pas être régénéré');
  },
};

module.exports = documentService;
