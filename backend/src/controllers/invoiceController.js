const service = require('../services/invoiceService');
const pdfService = require('../services/pdfService');
const audit = require('../services/auditService');
const response = require('../utils/response');
const h = require('../utils/asyncHandler');

const log = (req, inv, action, description) => audit.log(req, { entity_type: 'invoice', entity_id: inv._id, action, description });

module.exports = {
  createInvoice: h(async (req, res) => {
    const inv = await service.createInvoice(req.body, req.user);
    log(req, inv, 'create', `Création du document ${inv.invoice_number}`);
    response.created(res, inv, inv.type === 'proforma' ? 'Proforma créée' : 'Facture créée');
  }),
  createFromReservation: h(async (req, res) => {
    const inv = await service.createFromReservation(req.params.reservationId, req.body, req.user);
    log(req, inv, 'create', `Création du document ${inv.invoice_number}`);
    response.created(res, inv, inv.type === 'proforma' ? 'Proforma créée' : 'Facture créée');
  }),
  getAllInvoices: h(async (req, res) => { const r = await service.getAllInvoices(req.query); response.paginated(res, r.invoices, r, 'Factures récupérées'); }),
  getInvoiceById: h(async (req, res) => response.success(res, await service.getInvoiceById(req.params.id))),
  updateInvoice: h(async (req, res) => {
    const inv = await service.updateInvoice(req.params.id, req.body);
    log(req, inv, req.body.status === 'cancelled' ? 'cancel' : 'update', `Modification du document ${inv.invoice_number}`);
    response.success(res, inv, 'Facture mise à jour');
  }),
  deleteInvoice: h(async (req, res) => {
    const r = await service.deleteInvoice(req.params.id);
    log(req, { _id: req.params.id }, 'delete', `Suppression du document ${r.invoice_number}`);
    response.success(res, null, r.message);
  }),
  markSent: h(async (req, res) => {
    const inv = await service.markSent(req.params.id);
    log(req, inv, 'update', `Facture ${inv.invoice_number} marquée comme envoyée`);
    response.success(res, inv, 'Facture marquée comme envoyée');
  }),
  markPaid: h(async (req, res) => {
    const inv = await service.markPaid(req.params.id, req.body, req.user);
    log(req, inv, 'payment', `Règlement de la facture ${inv.invoice_number}`);
    response.success(res, inv, 'Facture réglée');
  }),
  getInvoicesByReservation: h(async (req, res) => response.success(res, await service.getInvoicesByReservation(req.params.reservationId))),
  getInvoicesByClient: h(async (req, res) => response.success(res, await service.getInvoicesByClient(req.params.clientId))),
  getInvoicesByDateRange: h(async (req, res) => response.success(res, await service.getInvoicesByDateRange(req.query.start_date || req.query.from, req.query.end_date || req.query.to))),
  generateInvoicePdf: h(async (req, res) => {
    const d = await pdfService.invoice(req.params.id, req.user);
    pdfService.sendPdf(res, d.buffer, d.filename, req.query.download === '1');
  }),
};
