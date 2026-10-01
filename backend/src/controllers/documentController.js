const service = require('../services/documentService');
const pdfService = require('../services/pdfService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

module.exports = {
  getAllDocuments: h(async (req, res) => { const r = await service.getAllDocuments(req.query); response.paginated(res, r.documents, r, 'Documents récupérés'); }),
  getDocumentById: h(async (req, res) => response.success(res, await service.getDocumentById(req.params.id))),
  getDocumentsByReservation: h(async (req, res) => response.success(res, await service.getDocumentsByReservation(req.params.reservationId))),
  deleteDocument: h(async (req, res) => { const r = await service.deleteDocument(req.params.id); response.success(res, null, r.message); }),
  downloadDocument: h(async (req, res) => {
    const d = await service.regenerate(req.params.id, req.user);
    pdfService.sendPdf(res, d.buffer, d.filename, req.query.download !== '0');
  }),
};
