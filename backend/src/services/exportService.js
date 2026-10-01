const ExcelJS = require('exceljs');
const reservationService = require('./reservationService');
const clientService = require('./clientService');
const paymentService = require('./paymentService');
const cashService = require('./cashService');
const reportService = require('./reportService');
const pdfService = require('./pdfService');
const settingsService = require('./settingsService');
const AppError = require('../utils/AppError');
const { ymd } = require('../utils/dates');

const { money, methodLabel } = pdfService;
const fr = (d) => (d ? ymd(d).split('-').reverse().join('/') : '');
const RES_STATUS = { pending: 'Option', confirmed: 'Confirmée', checked_in: 'En cours', checked_out: 'Terminée', cancelled: 'Annulée', no_show: 'No-show' };
const PAY_STATUS = { unpaid: 'Non payé', deposit: 'Avance reçue', partial: 'Partiellement payé', paid: 'Payé', refunded: 'Remboursé' };
const CLIENT_TYPE = { individual: 'Particulier', company: 'Entreprise', agency: 'Agence', ngo: 'ONG / Projet', diaspora: 'Diaspora', tourist: 'Touriste', local: 'Local', other: 'Autre' };
const fullName = (c) => (c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '');

const allPages = async (fn, query) => {
  const out = []; let page = 1;
  // Boucle de pagination interne pour exporter l'intégralité des lignes filtrées
  for (;;) {
    const r = await fn({ ...query, page, limit: 200 });
    const list = r.reservations || r.clients || r.payments || [];
    out.push(...list);
    if (out.length >= r.total || !list.length) break;
    page += 1;
  }
  return out;
};

const builders = {
  async reservations(query) {
    const list = await allPages((q) => reservationService.getAllReservations(q), query);
    return {
      title: 'Liste des réservations',
      columns: [
        { key: 'number', label: 'N°', width: 16, num: false }, { key: 'client', label: 'Client', width: 24 }, { key: 'room', label: 'Chambre(s)', width: 12 },
        { key: 'arrival', label: 'Arrivée', width: 11 }, { key: 'departure', label: 'Départ', width: 11 }, { key: 'nights', label: 'Nuits', width: 6 },
        { key: 'status', label: 'Statut', width: 12 }, { key: 'payment', label: 'Paiement', width: 16 }, { key: 'source', label: 'Source', width: 12 },
        { key: 'total', label: 'Total', width: 13, money: true }, { key: 'paid', label: 'Payé', width: 13, money: true }, { key: 'balance', label: 'Solde', width: 13, money: true },
      ],
      rows: list.map((r) => ({
        number: r.reservation_number, client: fullName(r.client_id), room: [...new Set([r.room_id?.room_number, ...(r.rooms || []).map((l) => l.room_number)].filter(Boolean))].join(', '),
        arrival: fr(r.arrival_date), departure: fr(r.departure_date), nights: r.nights, status: RES_STATUS[r.status] || r.status, payment: PAY_STATUS[r.payment_status] || r.payment_status,
        source: r.source, total: r.total_amount, paid: r.paid_amount, balance: r.balance_amount,
      })),
      sumKeys: ['total', 'paid', 'balance'], landscape: true, docType: 'other',
    };
  },
  async clients(query) {
    const list = await allPages((q) => clientService.getAllClients(q), query);
    return {
      title: 'Liste des clients',
      columns: [
        { key: 'name', label: 'Nom', width: 24 }, { key: 'type', label: 'Type', width: 14 }, { key: 'company', label: 'Société', width: 18 }, { key: 'phone', label: 'Téléphone', width: 16 },
        { key: 'email', label: 'Email', width: 24 }, { key: 'nationality', label: 'Nationalité', width: 13 }, { key: 'stays', label: 'Séjours', width: 8 }, { key: 'spent', label: 'Total payé', width: 14, money: true }, { key: 'vip', label: 'VIP', width: 6 },
      ],
      rows: list.map((c) => ({ name: fullName(c), type: CLIENT_TYPE[c.client_type] || '', company: c.company || '', phone: c.phone || '', email: c.email || '', nationality: c.nationality || '', stays: c.reservations_count, spent: c.total_spent, vip: c.is_vip ? 'Oui' : '' })),
      sumKeys: ['spent'], landscape: true,
    };
  },
  async payments(query) {
    const list = await allPages((q) => paymentService.getAllPayments(q), query);
    return {
      title: 'Liste des paiements',
      columns: [
        { key: 'date', label: 'Date', width: 11 }, { key: 'receipt', label: 'Reçu', width: 16 }, { key: 'reservation', label: 'Réservation', width: 16 }, { key: 'client', label: 'Client', width: 22 },
        { key: 'method', label: 'Mode', width: 14 }, { key: 'type', label: 'Type', width: 11 }, { key: 'reference', label: 'Référence', width: 16 }, { key: 'by', label: 'Encaissé par', width: 16 }, { key: 'amount', label: 'Montant', width: 14, money: true },
      ],
      rows: list.map((p) => ({
        date: fr(p.payment_date), receipt: p.receipt_number || '', reservation: p.reservation_id?.reservation_number || '', client: fullName(p.reservation_id?.client_id),
        method: methodLabel(p.payment_method), type: p.type === 'refund' ? 'Remboursement' : 'Paiement', reference: p.reference || '',
        by: p.processed_by ? fullName(p.processed_by) : '', amount: p.type === 'refund' ? -p.amount : p.amount,
      })),
      sumKeys: ['amount'], landscape: true,
    };
  },
  async cash(query) {
    const d = await cashService.getDaily(query);
    const rows = d.payments.map((p) => ({
      time: new Date(p.payment_date).toISOString().slice(11, 16), receipt: p.receipt_number || '', reservation: p.reservation_id?.reservation_number || '', client: fullName(p.reservation_id?.client_id),
      method: methodLabel(p.payment_method), by: p.processed_by ? fullName(p.processed_by) : '', amount: p.type === 'refund' ? -p.amount : p.amount,
    }));
    return {
      title: `Caisse du ${fr(d.date)}`, subtitle: d.is_closed ? 'Journée clôturée' : 'Journée ouverte',
      columns: [
        { key: 'time', label: 'Heure', width: 8 }, { key: 'receipt', label: 'Reçu', width: 16 }, { key: 'reservation', label: 'Réservation', width: 16 }, { key: 'client', label: 'Client', width: 24 },
        { key: 'method', label: 'Mode', width: 14 }, { key: 'by', label: 'Encaissé par', width: 18 }, { key: 'amount', label: 'Montant', width: 14, money: true },
      ],
      rows,
      extraTotals: Object.entries(d.by_method).map(([m, v]) => [`Total ${methodLabel(m)}`, v.net]).concat([['TOTAL NET', d.totals.net_total]]),
      sumKeys: [], docType: 'cash_report',
    };
  },
  async occupancy(query) {
    const r = await reportService.occupancy(query);
    return {
      title: 'Taux d\'occupation', subtitle: `${fr(r.from)} au ${fr(r.to)}`,
      columns: [{ key: 'date', label: 'Date', width: 14 }, { key: 'occupied', label: 'Chambres occupées', width: 18 }, { key: 'total', label: 'Total chambres', width: 16 }, { key: 'rate', label: 'Taux (%)', width: 10 }, { key: 'arrivals', label: 'Arrivées', width: 10 }, { key: 'departures', label: 'Départs', width: 10 }],
      rows: r.rows.map((x) => ({ ...x, date: fr(x.date) })), sumKeys: [],
    };
  },
  async receivables() {
    const r = await reportService.receivables();
    return {
      title: 'Créances clients (soldes impayés)',
      columns: [
        { key: 'number', label: 'Réservation', width: 16 }, { key: 'client', label: 'Client', width: 24 }, { key: 'phone', label: 'Téléphone', width: 16 }, { key: 'departure', label: 'Départ', width: 11 },
        { key: 'total', label: 'Total', width: 14, money: true }, { key: 'paid', label: 'Payé', width: 14, money: true }, { key: 'balance', label: 'Solde dû', width: 14, money: true },
      ],
      rows: r.rows.map((x) => ({ number: x.reservation_number, client: x.client_name, phone: x.client_phone || '', departure: fr(x.departure_date), total: x.total_amount, paid: x.paid_amount, balance: x.balance_amount })),
      sumKeys: ['total', 'paid', 'balance'], landscape: true,
    };
  },
};

const exportService = {
  types: Object.keys(builders),

  async build(type, format, query = {}, user) {
    const builder = builders[type];
    if (!builder) throw AppError.badRequest(`Type d'export inconnu : ${type}`);
    if (!['xlsx', 'pdf'].includes(format)) throw AppError.badRequest('Format invalide (xlsx ou pdf)');
    const settings = await settingsService.getHotelSettings();
    const cur = settings.currency || 'FCFA';
    const def = await builder(query);
    const stamp = ymd(new Date());
    const base = `${type}-${stamp}`;

    const sums = {};
    (def.sumKeys || []).forEach((k) => { sums[k] = def.rows.reduce((s, r) => s + (Number(r[k]) || 0), 0); });

    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      wb.creator = settings.name;
      const ws = wb.addWorksheet(def.title.replace(/[*?:\\/\[\]]/g, '-').slice(0, 30));
      ws.addRow([settings.name]).font = { bold: true, size: 14 };
      ws.addRow([def.title + (def.subtitle ? ` — ${def.subtitle}` : '')]).font = { bold: true };
      ws.addRow([`Généré le ${fr(new Date())}`]);
      ws.addRow([]);
      const headerRow = ws.addRow(def.columns.map((c) => c.label));
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F4C81' } }; });
      def.rows.forEach((r) => ws.addRow(def.columns.map((c) => r[c.key])));
      def.columns.forEach((c, i) => { const col = ws.getColumn(i + 1); col.width = Math.max(c.width, c.label.length + 2); if (c.money) col.numFmt = '# ##0'; });
      if (def.sumKeys?.length) {
        const tr = ws.addRow(def.columns.map((c, i) => (i === 0 ? 'TOTAL' : sums[c.key] ?? '')));
        tr.font = { bold: true };
      }
      (def.extraTotals || []).forEach(([k, v]) => { const tr = ws.addRow([k, v]); tr.font = { bold: true }; });
      ws.views = [{ state: 'frozen', ySplit: 5 }];
      const buffer = Buffer.from(await wb.xlsx.writeBuffer());
      return { buffer, filename: `${base}.xlsx`, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };
    }

    const rows = def.rows.map((r) => Object.fromEntries(def.columns.map((c) => [c.key, c.money ? money(r[c.key], cur) : r[c.key]])));
    const totals = [...(def.sumKeys || []).map((k) => [`Total ${def.columns.find((c) => c.key === k).label}`, money(sums[k], cur)]), ...(def.extraTotals || []).map(([k, v]) => [k, money(v, cur)])];
    const pdf = await pdfService.tableReport({
      title: def.title, subtitle: def.subtitle, columns: def.columns.map((c) => ({ key: c.key, label: c.label, width: c.width, align: c.money ? 'right' : 'left' })),
      rows, totals, landscape: !!def.landscape, docType: def.docType || 'other', filename: `${base}.pdf`,
    }, user);
    return { ...pdf, mime: 'application/pdf' };
  },
};

module.exports = exportService;
