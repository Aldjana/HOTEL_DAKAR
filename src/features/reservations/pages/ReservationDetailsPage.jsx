import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Ban, CheckCircle2, CreditCard, FileText, LogIn, LogOut, MessageCircle, Pencil, UserX } from 'lucide-react';
import { ErrorState, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useReservationLabel } from '../../../context/PageMetaContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { usePaymentMethods, useReservationSources } from '../../../hooks/useReference';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { invoicesApi } from '../../../services/api/invoicesApi';
import { settingsApi } from '../../../services/api/settingsApi';
import { getErrorMessage } from '../../../services/api/client';
import { openPdf } from '../../../services/download';
import { AUDIT_ACTION_LABELS, PAYMENT_STATUS_LABELS, RESERVATION_PAYMENT_LABELS, RESERVATION_STATUS_LABELS } from '../../../constants/status';
import PaymentFormModal from '../components/PaymentFormModal';
import ChangeRoomModal from '../components/ChangeRoomModal';
import { DetailsClientCard, DetailsDocumentsCard, DetailsHistoryCard, DetailsPaymentsCard, DetailsStayCard } from '../components/DetailsSections';
import { roomList, sourceLabel } from '../components/DetailsFormat';
import { useT } from '../../../i18n';

const GREEN = 'bg-[#d8f8ea] text-[#0f9f6e]';
const AMBER = 'bg-[#fde9c8] text-[#c47a12]';
const RED = 'bg-red-50 text-red-500';
const SLATE = 'bg-slate-100 text-slate-500';
const STATUS_TONE = { pending: AMBER, confirmed: GREEN, checked_in: GREEN, checked_out: SLATE, cancelled: RED, no_show: RED };
const PAY_TONE = { unpaid: RED, deposit: AMBER, partial: AMBER, paid: GREEN, refunded: SLATE };

const outlineBtn = 'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700';
const darkBtn = 'inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-[#0D1520] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-60';
const dangerBtn = 'inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-[13px] font-semibold text-red-500 disabled:opacity-60';

const ReservationDetailsPage = () => {
  const { t } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAuth();
  const payMethods = usePaymentMethods();
  const sources = useReservationSources();
  const [paying, setPaying] = useState(false);
  const [changing, setChanging] = useState(false);
  const [busy, setBusy] = useState('');
  const [hotel, setHotel] = useState(null);
  const { data: r, loading, error, reload } = useFetch(() => reservationsApi.get(id), [id]);
  const { data: history } = useFetch(() => reservationsApi.history(id), [id, r?.updatedAt]);
  useReservationLabel(r?.reservation_number);

  useEffect(() => { settingsApi.getHotel().then(setHotel).catch(() => {}); }, []);

  if (loading && !r) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;

  const st = r.status;
  const open = ['pending', 'confirmed'].includes(st);
  const canWrite = can('reservations.write');
  const inactive = ['cancelled', 'no_show'].includes(st);
  const run = async (key, fn, ok) => {
    setBusy(key);
    try { const res = await fn(); if (ok) toast.success(ok); await reload(); return res; } catch (err) { toast.error(getErrorMessage(err)); return null; } finally { setBusy(''); }
  };
  const pdf = (url) => openPdf(url).catch((e) => toast.error(e.message));

  const cancel = async () => {
    const reason = await confirm({ title: t('Annuler {n} ?', { n: r.reservation_number }), message: t('La chambre sera libérée. Les paiements déjà reçus restent enregistrés et pourront être remboursés.'), confirmLabel: t('Annuler la réservation'), danger: true, reasonLabel: t("Motif d'annulation") });
    if (reason) run('cancel', () => reservationsApi.cancel(id, { reason: typeof reason === 'string' ? reason : undefined }), t('Réservation annulée'));
  };
  const noShow = async () => {
    if (await confirm({ title: t('Marquer comme no-show ?'), message: t("Le client ne s'est pas présenté. La chambre sera libérée."), confirmLabel: t('Marquer no-show'), danger: true })) run('noshow', () => reservationsApi.noShow(id, {}), t('Réservation marquée no-show'));
  };
  const makeInvoice = async (type) => {
    const inv = await run(type, () => invoicesApi.createForReservation(id, { type }), type === 'proforma' ? t('Proforma créée') : t('Facture émise'));
    if (inv?._id) navigate(`/invoices/${inv._id}`);
  };

  const rooms = roomList(r);
  const src = sources.find((s) => s.code === r.source)?.name || sourceLabel(r.source);
  const canInvoice = can('invoices.write') && st !== 'cancelled';
  const hasInvoice = r.invoices?.some((i) => i.type === 'invoice' && i.status !== 'cancelled');

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${STATUS_TONE[st] || SLATE}`}>
            <CheckCircle2 className="h-3.5 w-3.5" /> {RESERVATION_STATUS_LABELS[st] || st}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${PAY_TONE[r.payment_status] || SLATE}`}>
            <CreditCard className="h-3.5 w-3.5" /> {RESERVATION_PAYMENT_LABELS[r.payment_status] || r.payment_status}
          </span>
          {src && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[12px] font-semibold text-slate-500">
              <MessageCircle className="h-3.5 w-3.5" /> {src}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite && <button type="button" onClick={() => navigate(`/reservations/${id}/edit`)} className={outlineBtn}><Pencil className="h-4 w-4" /> {t('Modifier')}</button>}
          {can('payments.create') && !inactive && r.balance_amount > 0 && <button type="button" onClick={() => setPaying(true)} className={darkBtn}><CreditCard className="h-4 w-4" /> {t('Enregistrer paiement')}</button>}
          {canWrite && open && <button type="button" onClick={() => navigate(`/reservations/${id}/check-in`)} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-[#0f9f6e] px-3 py-2 text-[13px] font-semibold text-white"><LogIn className="h-4 w-4" /> {t('Faire check-in')}</button>}
          {canWrite && st === 'checked_in' && <button type="button" onClick={() => navigate(`/reservations/${id}/check-out`)} className={darkBtn}><LogOut className="h-4 w-4" /> {t('Faire check-out')}</button>}
          {canInvoice && !hasInvoice && <button type="button" disabled={busy === 'invoice'} onClick={() => makeInvoice('invoice')} className={outlineBtn}><FileText className="h-4 w-4" /> {t('Générer facture')}</button>}
          {canInvoice && <button type="button" disabled={busy === 'proforma'} onClick={() => makeInvoice('proforma')} className={outlineBtn}><FileText className="h-4 w-4" /> {t('Créer proforma')}</button>}
          {canWrite && open && <button type="button" disabled={busy === 'cancel'} onClick={cancel} className={dangerBtn}><Ban className="h-4 w-4" /> {t('Annuler')}</button>}
          {canWrite && open && <button type="button" disabled={busy === 'noshow'} onClick={noShow} className={dangerBtn}><UserX className="h-4 w-4" /> {t('No-show')}</button>}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailsClientCard client={r.client_id} />
        <DetailsStayCard r={r} rooms={rooms} hotel={hotel} canChange={canWrite && (open || st === 'checked_in')} onChangeRoom={() => setChanging(true)} />
      </div>

      <DetailsPaymentsCard r={r} payMethods={payMethods} statusLabels={{ ...PAYMENT_STATUS_LABELS }} />

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailsDocumentsCard r={r} onPdf={pdf} />
        <DetailsHistoryCard history={history || []} actionLabels={AUDIT_ACTION_LABELS} />
      </div>

      <PaymentFormModal isOpen={paying} onClose={() => setPaying(false)} reservation={r} onSaved={reload} />
      <ChangeRoomModal isOpen={changing} onClose={() => setChanging(false)} reservation={r} onDone={reload} />
    </>
  );
};

export default ReservationDetailsPage;
