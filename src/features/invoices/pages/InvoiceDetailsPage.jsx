import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CheckCircle2, Download, Printer, Send } from 'lucide-react';
import { Badge, Button, Card, ErrorState, Input, Modal, Select, Spinner, Table } from '../../../components/ui';
import { StatusBadge } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { usePaymentMethods } from '../../../hooks/useReference';
import { useApp } from '../../../context/AppContext';
import { invoicesApi } from '../../../services/api/invoicesApi';
import { getErrorMessage } from '../../../services/api/client';
import { downloadFile, openPdf } from '../../../services/download';
import { paymentMethodLabel } from '../../../constants/status';
import { formatDay, formatMoney, fullName } from '../../../utils/format';
import { tr, useT } from '../../../i18n';

const InvoiceDetailsPage = () => {
  const { id } = useParams();
  const toast = useToast();
  const { t } = useT();
  const confirm = useConfirm();
  const { can } = useAuth();
  const { settings } = useApp();
  const methods = usePaymentMethods();
  const { data: inv, loading, error, reload } = useFetch(() => invoicesApi.get(id), [id]);
  const [paying, setPaying] = useState(false);
  const [pay, setPay] = useState({ payment_method: 'cash', reference: '' });
  const [busy, setBusy] = useState('');

  if (loading && !inv) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const write = can('invoices.write');
  const cancelled = inv.status === 'cancelled';
  const proforma = inv.type === 'proforma';
  const run = async (key, fn, ok) => { setBusy(key); try { await fn(); toast.success(ok); reload(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(''); } };

  const cancel = async () => {
    const reason = await confirm({ title: t('Annuler {n} ?', { n: inv.invoice_number }), message: t("Une facture émise n'est jamais supprimée : elle est annulée et conservée pour la traçabilité."), confirmLabel: t('Annuler la facture'), danger: true, reasonLabel: t("Motif d'annulation") });
    if (reason) run('cancel', () => invoicesApi.update(id, { status: 'cancelled', cancellation_reason: typeof reason === 'string' ? reason : undefined }), t('Facture annulée'));
  };
  const markPaid = async (e) => {
    e.preventDefault();
    await run('paid', () => invoicesApi.markPaid(id, { payment_method: pay.payment_method, reference: pay.reference || undefined }), t('Solde encaissé, facture payée'));
    setPaying(false);
  };

  return (
    <div>
      <Link to="/invoices" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 no-underline hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> {t('Factures')}</Link>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="m-0 text-[28px] font-bold tracking-tight text-slate-900">{proforma ? t('Proforma') : t('Facture')} {inv.invoice_number}</h2><div className="mt-1.5 flex gap-2"><StatusBadge status={inv.status} type="invoice" />{proforma && <Badge variant="purple" size="sm">{t('Non comptable')}</Badge>}</div></div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => openPdf(`/invoices/${id}/pdf`).catch((e) => toast.error(e.message))}><Printer className="h-4 w-4" /> {t('Aperçu / imprimer')}</Button>
          <Button variant="outline" onClick={() => downloadFile(`/invoices/${id}/pdf`, undefined, `${inv.invoice_number}.pdf`).catch((e) => toast.error(getErrorMessage(e)))}><Download className="h-4 w-4" /> {t('Télécharger')}</Button>
          {write && !cancelled && !proforma && ['issued', 'draft'].includes(inv.status) && <Button variant="outline" loading={busy === 'sent'} onClick={() => run('sent', () => invoicesApi.markSent(id), t('Facture marquée comme envoyée'))}><Send className="h-4 w-4" /> {t('Marquer envoyée')}</Button>}
          {write && !cancelled && !proforma && inv.balance_amount > 0 && <Button onClick={() => setPaying(true)}><CheckCircle2 className="h-4 w-4" /> {t('Encaisser le solde')}</Button>}
          {write && !cancelled && inv.paid_amount === 0 && <Button variant="danger-outline" onClick={cancel}><Ban className="h-4 w-4" /> {t('Annuler')}</Button>}
        </div>
      </div>
      {cancelled && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{t('Facture annulée le {d}', { d: formatDay(inv.cancelled_at) })}{inv.cancellation_reason && ` — ${inv.cancellation_reason}`}</div>}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card padded={false}>
            <div className="grid gap-4 border-b border-slate-100 p-5 sm:grid-cols-2">
              <div><p className="m-0 text-xs uppercase text-slate-500">{t('Émetteur')}</p><p className="m-0 font-semibold text-slate-800">{settings?.name}</p><p className="m-0 text-sm text-slate-500">{settings?.address}</p><p className="m-0 text-sm text-slate-500">{[settings?.phone, settings?.email].filter(Boolean).join(' · ')}</p></div>
              <div><p className="m-0 text-xs uppercase text-slate-500">{t('Facturé à')}</p><p className="m-0 font-semibold text-slate-800">{fullName(inv.client)}</p><p className="m-0 text-sm text-slate-500">{inv.client?.company}</p><p className="m-0 text-sm text-slate-500">{[inv.client?.phone, inv.client?.email].filter(Boolean).join(' · ')}</p></div>
            </div>
            <Table className="border-0 rounded-none" rowKey="_id" data={inv.items || []} emptyMessage={t('Aucune ligne')} columns={[
              { key: 'description', label: t('Désignation'), render: (v) => tr(v) }, { key: 'quantity', label: t('Qté'), align: 'right' },
              { key: 'unit_price', label: t('PU'), align: 'right', render: (v) => formatMoney(v) }, { key: 'total_price', label: t('Total'), align: 'right', render: (v) => formatMoney(v) },
            ]} />
            <div className="ml-auto max-w-xs space-y-1 p-5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{t('Sous-total')}</span><span>{formatMoney(inv.subtotal)}</span></div>
              {inv.discount_amount > 0 && <div className="flex justify-between"><span className="text-slate-500">{t('Remise')}</span><span>− {formatMoney(inv.discount_amount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">{t('Taxes')}</span><span>{formatMoney(inv.tax_amount)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold"><span>{t('Total')}</span><span>{formatMoney(inv.total_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t('Payé')}</span><span>{formatMoney(inv.paid_amount)}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">{t('Reste dû')}</span><b className={inv.balance_amount > 0 && !cancelled ? 'text-red-600' : ''}>{formatMoney(inv.balance_amount)}</b></div>
            </div>
          </Card>
          <Card title={t('Paiements de la réservation')} padded={false}>
            <Table className="border-0" rowKey="_id" data={inv.payments || []} emptyMessage={t('Aucun paiement')} columns={[
              { key: 'payment_date', label: t('Date'), render: (v) => formatDay(v) }, { key: 'payment_method', label: t('Mode'), render: (v) => paymentMethodLabel(v, methods) },
              { key: 'type', label: t('Type'), render: (v) => (v === 'refund' ? t('Remboursement') : t('Paiement')) },
              { key: 'amount', label: t('Montant'), align: 'right', render: (v, p) => <b>{p.type === 'refund' ? '−' : ''}{formatMoney(v)}</b> },
            ]} />
          </Card>
        </div>
        <div className="space-y-4">
          <Card title={t('Informations')}>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">{t("Date d'émission")}</span><span>{formatDay(inv.issue_date)}</span></div>
              {inv.due_date && <div className="flex justify-between"><span className="text-slate-500">{t('Échéance')}</span><span>{formatDay(inv.due_date)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-500">{t('Réservation')}</span><Link to={`/reservations/${inv.reservation?._id}`} className="font-semibold text-emerald-600 no-underline">{inv.reservation?.reservation_number}</Link></div>
              {inv.reservation && <div className="flex justify-between"><span className="text-slate-500">{t('Séjour')}</span><span>{formatDay(inv.reservation.arrival_date)} → {formatDay(inv.reservation.departure_date)}</span></div>}
            </div>
            {inv.notes && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{inv.notes}</p>}
          </Card>
        </div>
      </div>
      <Modal isOpen={paying} onClose={() => setPaying(false)} title={t('Encaisser le solde')} size="sm">
        <form onSubmit={markPaid}>
          <p className="mb-3 text-sm text-slate-600">{t('Un paiement de')} <b>{formatMoney(inv.balance_amount)}</b> {t('sera enregistré sur la réservation.')}</p>
          <Select label={t('Mode de paiement')} value={pay.payment_method} onChange={(e) => setPay({ ...pay, payment_method: e.target.value })}>{(methods.length ? methods : [{ code: 'cash', name: t('Espèces') }]).map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}</Select>
          <Input label={t('Référence')} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setPaying(false)}>{t('Annuler')}</Button><Button type="submit" loading={busy === 'paid'}>{t('Encaisser')}</Button></div>
        </form>
      </Modal>
    </div>
  );
};

export default InvoiceDetailsPage;
