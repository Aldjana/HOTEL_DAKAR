import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { ErrorState, Spinner } from '../../../components/ui';
import { StatusBadge } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useReservationLabel } from '../../../context/PageMetaContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useFetch } from '../../../hooks/useFetch';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { invoicesApi } from '../../../services/api/invoicesApi';
import { getErrorCode, getErrorMessage } from '../../../services/api/client';
import { openPdf } from '../../../services/download';
import PaymentFormModal from '../components/PaymentFormModal';
import { CheckOutClientCard, CheckOutFeesCard, CheckOutFinanceCard, CheckOutRoomCard } from '../components/CheckOutSections';
import { moneyFR, roomList } from '../components/DetailsFormat';
import { useT } from '../../../i18n';

const CheckOutPage = () => {
  const { t } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const { data: r, loading, error, reload } = useFetch(() => reservationsApi.get(id), [id]);
  useReservationLabel(r?.reservation_number);
  const [allowUnpaid, setAllowUnpaid] = useState(false);
  const [keys, setKeys] = useState(false);
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  if (loading && !r) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const balance = Math.max(r.balance_amount || 0, 0);
  const notLive = r.status !== 'checked_in';
  const rooms = roomList(r);
  const invoice = r.invoices?.find((i) => i.type === 'invoice' && i.status !== 'cancelled') || r.invoices?.[0];
  const lastPayment = [...(r.payments || [])].reverse().find((p) => p.type !== 'refund' && p.receipt_number);
  const blocked = notLive || (balance > 0 && !allowUnpaid);

  const submit = async () => {
    setErr('');
    setSaving(true);
    try {
      await reservationsApi.checkOut(id, { allow_unpaid: allowUnpaid || undefined });
      toast.success(t('Check-out effectué : facture générée, chambre à nettoyer'));
      navigate(`/reservations/${id}`);
    } catch (e) {
      setErr(getErrorCode(e) === 'BALANCE_DUE' ? t('{msg}. Encaissez le solde ou autorisez explicitement un départ avec impayé (« Marquer comme créance »).', { msg: getErrorMessage(e) }) : getErrorMessage(e));
      reload();
    } finally { setSaving(false); }
  };
  const invoiceAction = async () => {
    if (invoice) return navigate(`/invoices/${invoice._id}`);
    try { const inv = await invoicesApi.createForReservation(id, { type: 'invoice' }); toast.success(t('Facture émise')); if (inv?._id) navigate(`/invoices/${inv._id}`); } catch (e) { toast.error(getErrorMessage(e)); }
  };

  return (
    <>
      <div className="mb-4 text-[12px] text-slate-400">
        <Link to="/reservations" className="text-slate-400 no-underline">{t('Réservations')}</Link> &nbsp;›&nbsp; <Link to={`/reservations/${id}`} className="text-slate-600 no-underline">#{r.reservation_number}</Link> &nbsp;›&nbsp; {t('Check-out')}
      </div>

      {notLive && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{t('Cette réservation est «')} <StatusBadge status={r.status} /> {t('» : le check-out nécessite un séjour en cours.')}</div>}
      {err && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">{err}</div>}
      {balance > 0 && !notLive && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <div className="font-semibold">{t('Un solde reste à encaisser avant la clôture du séjour.')}</div>
              <div className="text-red-500">{t('Veuillez régulariser le paiement de {amount} pour finaliser la sortie du client.', { amount: moneyFR(balance) })}</div>
            </div>
          </div>
          {can('payments.create') && <button type="button" onClick={() => setPaying(true)} className="cursor-pointer border-none bg-transparent font-semibold text-red-600">{t('Payer maintenant')}</button>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <CheckOutClientCard r={r} rooms={rooms} />
          <CheckOutFeesCard
            r={r}
            canInvoice={can('invoices.write') && r.status !== 'cancelled' || !!invoice} hasInvoice={!!invoice} onInvoice={invoiceAction}
            canReceipt={!!lastPayment} onReceipt={() => openPdf(`/payments/${lastPayment._id}/receipt`).catch((e) => toast.error(e.message))}
            canDebt={balance > 0 && !notLive && can('reservations.write')} debt={allowUnpaid} onDebt={() => setAllowUnpaid((v) => !v)}
          />
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <CheckOutFinanceCard r={r} balance={balance} canPay={!notLive && can('payments.create')} onPay={() => setPaying(true)} />
          <CheckOutRoomCard
            rooms={rooms} keys={keys} setKeys={setKeys} disabled={blocked} saving={saving} onValidate={submit}
            hint={notLive ? t('Le check-out nécessite un séjour en cours.') : allowUnpaid && balance > 0 ? t('Départ avec impayé autorisé : une créance sera suivie dans les rapports.') : blocked ? t("Veuillez d'abord solder le compte pour activer ce bouton.") : ''}
          />
        </aside>
      </div>
      <PaymentFormModal isOpen={paying} onClose={() => setPaying(false)} reservation={r} onSaved={reload} />
    </>
  );
};

export default CheckOutPage;
