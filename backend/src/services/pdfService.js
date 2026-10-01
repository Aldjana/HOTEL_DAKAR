const PDFDocument = require('pdfkit');
const { Invoice, InvoiceItem, Payment, Reservation, Document, Room } = require('../models');
const settingsService = require('./settingsService');
const AppError = require('../utils/AppError');
const { ymd } = require('../utils/dates');

const money = (n, cur = 'FCFA') => `${String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${cur}`;
const dfr = (d) => { if (!d) return '—'; const x = new Date(d); return `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`; };
const dtfr = (d) => { if (!d) return '—'; const x = new Date(d); return `${dfr(d)} ${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`; };

const METHOD_LABELS = { cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', free_money: 'Free Money', credit_card: 'Carte bancaire', debit_card: 'Carte de débit', mobile_money: 'Mobile money', bank_transfer: 'Virement', check: 'Chèque', ota: 'OTA', other: 'Autre' };
const methodLabel = (m) => METHOD_LABELS[m] || m;
const STATUS_LABELS = { draft: 'Brouillon', issued: 'Émise', sent: 'Envoyée', partially_paid: 'Partiellement payée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' };

const toBuffer = (build) => new Promise((resolve, reject) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => resolve(Buffer.concat(chunks)));
  doc.on('error', reject);
  try { build(doc); doc.end(); } catch (e) { reject(e); }
});

const logoBuffer = (settings) => {
  const m = /^data:image\/(png|jpe?g);base64,(.+)$/i.exec(settings.logo_url || '');
  return m ? Buffer.from(m[2], 'base64') : null;
};

const header = (doc, settings, title, subtitle) => {
  const left = 40; let y = 40;
  const logo = logoBuffer(settings);
  let textX = left;
  if (logo) { try { doc.image(logo, left, y, { fit: [70, 55] }); textX = left + 80; } catch (e) { /* logo illisible */ } }
  doc.fillColor('#111').font('Helvetica-Bold').fontSize(15).text(settings.name || 'Établissement', textX, y, { width: 300 });
  doc.font('Helvetica').fontSize(8.5).fillColor('#444');
  [settings.address, [settings.phone, settings.email].filter(Boolean).join(' · '), settings.ninea && `NINEA : ${settings.ninea}`, settings.rccm && `RCCM : ${settings.rccm}`]
    .filter(Boolean).forEach((l) => doc.text(l, textX, doc.y, { width: 300 }));
  doc.font('Helvetica-Bold').fontSize(18).fillColor('#0f4c81').text(title, 340, y, { width: 215, align: 'right' });
  if (subtitle) doc.font('Helvetica').fontSize(9).fillColor('#444').text(subtitle, 340, doc.y, { width: 215, align: 'right' });
  doc.moveDown(0.5);
  const lineY = Math.max(doc.y, y + 62) + 8;
  doc.moveTo(40, lineY).lineTo(555, lineY).strokeColor('#0f4c81').lineWidth(1.2).stroke();
  doc.y = lineY + 12; doc.x = 40; doc.fillColor('#111');
};

const footer = (doc, settings, extra) => {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    const y = 780;
    doc.moveTo(40, y - 6).lineTo(555, y - 6).strokeColor('#ccc').lineWidth(0.5).stroke();
    doc.font('Helvetica').fontSize(7.5).fillColor('#666');
    const parts = [extra, settings.invoice_footer, settings.legal_mentions].filter(Boolean).join(' — ');
    if (parts) doc.text(parts, 40, y, { width: 515, align: 'center', lineBreak: true, height: 30 });
    doc.text(`Page ${i + 1}/${range.count}`, 40, 820, { width: 515, align: 'right', lineBreak: false });
  }
};

const table = (doc, columns, rows, { rowHeight = 18, headerFill = '#0f4c81' } = {}) => {
  const x0 = 40; const total = columns.reduce((s, c) => s + c.width, 0);
  const drawHeader = () => {
    const y = doc.y;
    doc.rect(x0, y, total, rowHeight).fill(headerFill);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8);
    let x = x0;
    columns.forEach((c) => { doc.text(c.label, x + 4, y + 5, { width: c.width - 8, align: c.align || 'left', lineBreak: false }); x += c.width; });
    doc.y = y + rowHeight; doc.fillColor('#111');
  };
  drawHeader();
  rows.forEach((row, idx) => {
    if (doc.y + rowHeight > 760) { doc.addPage(); drawHeader(); }
    const y = doc.y;
    if (idx % 2 === 1) doc.rect(x0, y, total, rowHeight).fill('#f3f6fa');
    doc.fillColor('#111').font(row._bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);
    let x = x0;
    columns.forEach((c) => {
      const v = row[c.key] === undefined || row[c.key] === null ? '' : String(row[c.key]);
      doc.text(v, x + 4, y + 5, { width: c.width - 8, align: c.align || 'left', lineBreak: false, ellipsis: true });
      x += c.width;
    });
    doc.y = y + rowHeight;
  });
  doc.x = x0;
};

const logDocument = async ({ type, number, filename, user, reservation_id, client_id, ref_id, size }) => {
  try {
    await Document.create({ document_type: type, number, file_name: filename, mime_type: 'application/pdf', file_size: size, uploaded_by: user?._id, reservation_id, client_id, ref_id });
  } catch (e) { /* historique non bloquant */ }
};

const sendPdf = (res, buffer, filename, download = false) => {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `${download ? 'attachment' : 'inline'}; filename="${filename}"`);
  res.setHeader('Content-Length', buffer.length);
  res.send(buffer);
};

const pdfService = {
  sendPdf, money, methodLabel,

  async invoice(invoiceId, user) {
    const invoice = await Invoice.findById(invoiceId).populate('client_id').populate('reservation_id');
    if (!invoice) throw AppError.notFound('Facture non trouvée');
    const [items, settings] = await Promise.all([InvoiceItem.find({ invoice_id: invoiceId }).sort({ createdAt: 1 }), settingsService.getHotelSettings()]);
    const payments = await Payment.find({ reservation_id: invoice.reservation_id._id, payment_status: { $in: ['completed', 'refunded'] } }).sort({ payment_date: 1 });
    const cur = settings.currency || 'FCFA';
    const isPro = invoice.type === 'proforma';

    const buffer = await toBuffer((doc) => {
      header(doc, settings, isPro ? 'FACTURE PROFORMA' : 'FACTURE', `N° ${invoice.invoice_number}`);
      const c = invoice.client_id; const r = invoice.reservation_id;
      const topY = doc.y;
      doc.font('Helvetica-Bold').fontSize(9).text('Facturé à', 40, topY);
      doc.font('Helvetica').fontSize(9.5).text(`${c.first_name} ${c.last_name}`, 40, doc.y);
      [c.company, c.address, c.phone, c.email].filter(Boolean).forEach((l) => doc.fontSize(8.5).fillColor('#444').text(l, 40, doc.y));
      doc.fillColor('#111');
      doc.font('Helvetica').fontSize(8.5);
      const info = [
        ['Date d\'émission', dfr(invoice.issue_date)],
        ['Échéance', invoice.due_date ? dfr(invoice.due_date) : '—'],
        ['Réservation', r.reservation_number],
        ['Séjour', `${dfr(r.arrival_date)} → ${dfr(r.departure_date)} (${r.nights} nuit${r.nights > 1 ? 's' : ''})`.replace('→', 'au')],
        ['Statut', STATUS_LABELS[invoice.status] || invoice.status],
      ];
      let iy = topY;
      info.forEach(([k, v]) => { doc.font('Helvetica-Bold').text(`${k} :`, 330, iy, { width: 80 }); doc.font('Helvetica').text(v, 412, iy, { width: 143 }); iy += 13; });
      doc.y = Math.max(doc.y, iy) + 14; doc.x = 40;

      table(doc, [
        { key: 'description', label: 'Désignation', width: 270 },
        { key: 'quantity', label: 'Qté', width: 40, align: 'right' },
        { key: 'unit_price', label: 'Prix unitaire', width: 100, align: 'right' },
        { key: 'total_price', label: 'Total', width: 105, align: 'right' },
      ], items.map((i) => ({ description: i.description, quantity: i.quantity, unit_price: money(i.unit_price, cur), total_price: money(i.total_price, cur) })));

      doc.moveDown(0.8);
      const totals = [['Sous-total', invoice.subtotal]];
      if (invoice.discount_amount) totals.push(['Remise', -invoice.discount_amount]);
      if (invoice.tax_amount) totals.push([`TVA${settings.vat_rate ? ` (${settings.vat_rate}%)` : ''}`, invoice.tax_amount]);
      totals.push(['TOTAL', invoice.total_amount]);
      if (!isPro) { totals.push(['Déjà réglé', invoice.paid_amount]); totals.push(['Reste à payer', Math.max(invoice.total_amount - invoice.paid_amount, 0)]); }
      totals.forEach(([k, v], idx) => {
        const y = doc.y; const bold = k === 'TOTAL' || k === 'Reste à payer';
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 10 : 9).text(k, 330, y, { width: 110 }).text(money(v, cur), 440, y, { width: 115, align: 'right' });
        doc.y = y + 15;
      });

      if (!isPro && payments.length) {
        doc.moveDown(1).font('Helvetica-Bold').fontSize(9).text('Paiements reçus', 40, doc.y);
        doc.moveDown(0.3);
        table(doc, [
          { key: 'date', label: 'Date', width: 80 }, { key: 'mode', label: 'Mode', width: 110 },
          { key: 'ref', label: 'Référence', width: 170 }, { key: 'amount', label: 'Montant', width: 155, align: 'right' },
        ], payments.map((p) => ({ date: dfr(p.payment_date), mode: methodLabel(p.payment_method), ref: p.reference || p.receipt_number || '', amount: `${p.type === 'refund' ? '-' : ''}${money(p.amount, cur)}` })), { rowHeight: 16 });
      }
      if (invoice.notes) { doc.moveDown(1).font('Helvetica-Bold').fontSize(8.5).text('Notes', 40, doc.y).font('Helvetica').text(invoice.notes, 40, doc.y, { width: 515 }); }
      if (settings.conditions) { doc.moveDown(1).font('Helvetica-Bold').fontSize(8.5).text('Conditions', 40, doc.y).font('Helvetica').fontSize(8).text(settings.conditions, 40, doc.y, { width: 515 }); }
      if (invoice.status === 'cancelled') doc.save().rotate(-30, { origin: [300, 400] }).font('Helvetica-Bold').fontSize(70).fillColor('#dc2626', 0.18).text('ANNULÉE', 120, 380).restore();
      else if (invoice.status === 'paid') doc.save().rotate(-30, { origin: [300, 400] }).font('Helvetica-Bold').fontSize(70).fillColor('#16a34a', 0.15).text('PAYÉE', 170, 380).restore();
      footer(doc, settings, isPro ? 'Document non fiscal — proforma' : null);
    });
    const filename = `${invoice.invoice_number}.pdf`;
    await logDocument({ type: isPro ? 'proforma' : 'invoice', number: invoice.invoice_number, filename, user, reservation_id: invoice.reservation_id._id, client_id: invoice.client_id._id, ref_id: invoice._id, size: buffer.length });
    return { buffer, filename };
  },

  async receipt(paymentId, user) {
    const p = await Payment.findById(paymentId).populate('processed_by', 'first_name last_name');
    if (!p) throw AppError.notFound('Paiement non trouvé');
    const r = await Reservation.findById(p.reservation_id).populate('client_id');
    const settings = await settingsService.getHotelSettings();
    const cur = settings.currency || 'FCFA';
    const number = p.receipt_number || `REC-${String(p._id).slice(-6).toUpperCase()}`;
    const buffer = await toBuffer((doc) => {
      header(doc, settings, p.type === 'refund' ? 'REÇU DE REMBOURSEMENT' : 'REÇU DE PAIEMENT', `N° ${number}`);
      const rows = [
        ['Date', dtfr(p.payment_date)], ['Client', `${r.client_id.first_name} ${r.client_id.last_name}`], ['Réservation', r.reservation_number],
        ['Séjour', `${dfr(r.arrival_date)} au ${dfr(r.departure_date)}`], ['Mode de paiement', methodLabel(p.payment_method)],
        ['Référence', p.reference || '—'], ['Encaissé par', p.processed_by ? `${p.processed_by.first_name} ${p.processed_by.last_name}` : '—'],
      ];
      rows.forEach(([k, v]) => { const y = doc.y; doc.font('Helvetica-Bold').fontSize(10).text(`${k} :`, 60, y, { width: 150 }).font('Helvetica').text(v, 215, y, { width: 330 }); doc.y = y + 20; });
      doc.moveDown(1);
      doc.roundedRect(60, doc.y, 475, 60, 6).lineWidth(1).strokeColor('#0f4c81').stroke();
      doc.font('Helvetica-Bold').fontSize(20).fillColor('#0f4c81').text(`${p.type === 'refund' ? '-' : ''}${money(p.amount, cur)}`, 60, doc.y + 18, { width: 475, align: 'center' });
      doc.fillColor('#111'); doc.y += 60; doc.x = 40; doc.moveDown(1.5);
      [['Total du séjour', r.total_amount], ['Total réglé à ce jour', r.paid_amount], ['Solde restant dû', Math.max(r.balance_amount, 0)]].forEach(([k, v]) => {
        const y = doc.y; doc.font('Helvetica').fontSize(10).text(k, 60, y, { width: 250 }).font('Helvetica-Bold').text(money(v, cur), 315, y, { width: 220, align: 'right' }); doc.y = y + 18;
      });
      if (p.payment_status === 'voided') doc.save().rotate(-30, { origin: [300, 400] }).font('Helvetica-Bold').fontSize(70).fillColor('#dc2626', 0.18).text('ANNULÉ', 130, 380).restore();
      footer(doc, settings);
    });
    const filename = `${number}.pdf`;
    await logDocument({ type: 'receipt', number, filename, user, reservation_id: r._id, client_id: r.client_id._id, ref_id: p._id, size: buffer.length });
    return { buffer, filename };
  },

  async reservationSummary(reservationId, user) {
    const r = await Reservation.findById(reservationId).populate('client_id');
    if (!r) throw AppError.notFound('Réservation non trouvée');
    const [settings, payments] = await Promise.all([settingsService.getHotelSettings(), Payment.find({ reservation_id: r._id, payment_status: { $in: ['completed', 'refunded'] } }).sort({ payment_date: 1 })]);
    const roomDocs = await Room.find({ _id: { $in: (r.rooms?.length ? r.rooms.map((l) => l.room_id) : [r.room_id]) } }).populate('room_type_id');
    const cur = settings.currency || 'FCFA';
    const buffer = await toBuffer((doc) => {
      header(doc, settings, 'RÉSUMÉ DE RÉSERVATION', `N° ${r.reservation_number}`);
      const rows = [
        ['Client', `${r.client_id.first_name} ${r.client_id.last_name}`], ['Contact', [r.client_id.phone, r.client_id.email].filter(Boolean).join(' · ') || '—'],
        ['Arrivée', `${dfr(r.arrival_date)} (à partir de ${settings.check_in_time})`], ['Départ', `${dfr(r.departure_date)} (avant ${settings.check_out_time})`],
        ['Durée', `${r.nights} nuit${r.nights > 1 ? 's' : ''}`], ['Personnes', `${r.adults_count} adulte(s), ${r.children_count} enfant(s)`],
        ['Chambre(s)', roomDocs.map((x) => `${x.room_number}${x.room_type_id ? ` (${x.room_type_id.name})` : ''}`).join(', ')],
        ['Source', r.source || '—'], ['Statut', r.status], ['Demandes', r.special_requests || '—'],
      ];
      rows.forEach(([k, v]) => { const y = doc.y; doc.font('Helvetica-Bold').fontSize(9.5).text(`${k} :`, 40, y, { width: 110 }).font('Helvetica').text(v, 155, y, { width: 400 }); doc.y = Math.max(doc.y, y + 16); });
      doc.moveDown(1);
      [['Montant du séjour', r.subtotal_amount], ['Remise', -r.discount_amount], ['TVA', r.tax_amount], ['Taxe de séjour', r.stay_tax_amount], ['Total', r.total_amount], ['Réglé', r.paid_amount], ['Solde', Math.max(r.balance_amount, 0)]]
        .filter(([k, v]) => v || ['Total', 'Réglé', 'Solde'].includes(k)).forEach(([k, v]) => {
          const y = doc.y; const b = ['Total', 'Solde'].includes(k); doc.font(b ? 'Helvetica-Bold' : 'Helvetica').fontSize(9.5).text(k, 330, y, { width: 110 }).text(money(v, cur), 440, y, { width: 115, align: 'right' }); doc.y = y + 15;
        });
      if (payments.length) {
        doc.moveDown(1).font('Helvetica-Bold').fontSize(9).text('Paiements', 40, doc.y); doc.moveDown(0.3);
        table(doc, [{ key: 'date', label: 'Date', width: 90 }, { key: 'mode', label: 'Mode', width: 130 }, { key: 'ref', label: 'Référence', width: 150 }, { key: 'amount', label: 'Montant', width: 145, align: 'right' }],
          payments.map((p) => ({ date: dfr(p.payment_date), mode: methodLabel(p.payment_method), ref: p.reference || '', amount: `${p.type === 'refund' ? '-' : ''}${money(p.amount, cur)}` })), { rowHeight: 16 });
      }
      if (settings.conditions) { doc.moveDown(1).font('Helvetica-Bold').fontSize(8.5).text('Conditions', 40, doc.y).font('Helvetica').fontSize(8).text(settings.conditions, 40, doc.y, { width: 515 }); }
      footer(doc, settings);
    });
    const filename = `${r.reservation_number}-resume.pdf`;
    await logDocument({ type: 'reservation_summary', number: r.reservation_number, filename, user, reservation_id: r._id, client_id: r.client_id._id, ref_id: r._id, size: buffer.length });
    return { buffer, filename };
  },

  // PDF tabulaire générique (exports : réservations, clients, paiements, caisse, occupation, créances)
  async tableReport({ title, subtitle, columns, rows, totals, landscape = false, docType = 'other', filename }, user) {
    const settings = await settingsService.getHotelSettings();
    const buffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true, layout: landscape ? 'landscape' : 'portrait' });
      const chunks = []; doc.on('data', (c) => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
      try {
        header(doc, settings, title, subtitle);
        const usable = (landscape ? 842 : 595) - 80;
        const sum = columns.reduce((s, c) => s + c.width, 0);
        const scaled = columns.map((c) => ({ ...c, width: (c.width / sum) * usable }));
        table(doc, scaled, rows, { rowHeight: 16 });
        if (totals?.length) {
          doc.moveDown(0.8);
          totals.forEach(([k, v]) => { const y = doc.y; doc.font('Helvetica-Bold').fontSize(9.5).text(k, 40, y, { width: usable - 160 }).text(v, 40 + usable - 160, y, { width: 160, align: 'right' }); doc.y = y + 15; });
        }
        const range = doc.bufferedPageRange();
        for (let i = range.start; i < range.start + range.count; i++) {
          doc.switchToPage(i); doc.font('Helvetica').fontSize(7.5).fillColor('#666');
          doc.text(`Généré le ${dtfr(new Date())} — Page ${i + 1}/${range.count}`, 40, (landscape ? 575 : 820), { width: usable, align: 'right', lineBreak: false });
        }
        doc.end();
      } catch (e) { reject(e); }
    });
    await logDocument({ type: docType, number: filename.replace(/\.pdf$/, ''), filename, user, size: buffer.length });
    return { buffer, filename };
  },
};

module.exports = pdfService;
