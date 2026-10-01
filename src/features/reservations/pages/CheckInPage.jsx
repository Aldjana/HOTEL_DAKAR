import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { Input, Select, ErrorState, Spinner } from '../../../components/ui';
import { StatusBadge } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useReservationLabel } from '../../../context/PageMetaContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useFetch } from '../../../hooks/useFetch';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { getErrorCode, getErrorMessage } from '../../../services/api/client';
import { ID_DOCUMENT_TYPES } from '../../../constants/status';
import { formatDay, todayStr, toInputDate } from '../../../utils/format';
import PaymentFormModal from '../components/PaymentFormModal';
import { CheckInChecklist, CheckInNote, CheckInPaymentCard, CheckInRoomCard, CheckInSummary } from '../components/CheckInSections';
import { roomList } from '../components/DetailsFormat';
import { useT } from '../../../i18n';

const sectionCls = 'mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm';
const fieldCls = 'rounded-lg border border-slate-200 px-3 py-2 text-[13px]';

const CheckInPage = () => {
  const { t } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const { data: r, loading, error, reload } = useFetch(() => reservationsApi.get(id), [id]);
  useReservationLabel(r?.reservation_number);
  const [guests, setGuests] = useState(null);
  const [doc, setDoc] = useState({ id_document_type: '', id_document_number: '' });
  const [checks, setChecks] = useState({});
  const [paying, setPaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [early, setEarly] = useState(false);

  if (loading && !r) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const list = guests ?? r.guests ?? [];
  const rooms = roomList(r);
  const isEarly = toInputDate(r.arrival_date) > todayStr();
  const notOpen = !['pending', 'confirmed'].includes(r.status);
  const docType = doc.id_document_type || r.client_id?.id_document_type || '';
  const docNumber = doc.id_document_number || r.client_id?.id_document_number || '';
  const derived = { id: !!docNumber, pay: (r.balance_amount || 0) <= 0, room: rooms.length > 0 && rooms.every((x) => ['clean', 'available', 'reserved'].includes(x.status)) };
  const isDone = (k) => checks[k] ?? !!derived[k];

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      await reservationsApi.checkIn(id, {
        guests: list.filter((g) => g.full_name?.trim()), allow_early: isEarly ? early : undefined,
        id_document_type: doc.id_document_type || undefined, id_document_number: doc.id_document_number || undefined,
      });
      toast.success(t('Check-in effectué : chambre occupée'));
      navigate(`/reservations/${id}`);
    } catch (e) { setErr(getErrorMessage(e)); if (getErrorCode(e) === 'ROOM_NOT_CLEAN') setErr(t('{msg} — marquez-la propre depuis « Ménage » ou « Chambres ».', { msg: getErrorMessage(e) })); } finally { setSaving(false); }
  };
  const upd = (i, patch) => setGuests(list.map((g, k) => (k === i ? { ...g, ...patch } : g)));

  return (
    <>
      {notOpen && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] text-red-600">{t('Cette réservation est «')} <StatusBadge status={r.status} /> {t("» : le check-in n'est plus possible.")}</div>}
      {err && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">{err}</div>}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <CheckInSummary r={r} rooms={rooms} />
          <CheckInChecklist isDone={isDone} toggle={(k) => setChecks((c) => ({ ...c, [k]: !isDone(k) }))} />

          <section className={sectionCls}>
            <h3 className="mb-4 text-[14px] font-semibold text-slate-800">{t("Pièce d'identité du client")}</h3>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Select label={t('Type')} value={docType} onChange={(e) => setDoc({ ...doc, id_document_type: e.target.value })} options={ID_DOCUMENT_TYPES} />
              <Input label={t('Numéro')} value={docNumber} onChange={(e) => setDoc({ ...doc, id_document_number: e.target.value })} />
            </div>
          </section>

          <section className={sectionCls}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="m-0 text-[14px] font-semibold text-slate-800">{t('Personnes accompagnantes')}</h3>
              <button type="button" onClick={() => setGuests([...list, { full_name: '', id_document_number: '', is_child: false }])} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700"><Plus className="h-4 w-4" /> {t('Ajouter')}</button>
            </div>
            {list.length === 0 ? <p className="m-0 text-[13px] text-slate-500">{t('Aucune personne enregistrée en plus du client.')}</p> : list.map((g, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
                <input value={g.full_name} onChange={(e) => upd(i, { full_name: e.target.value })} placeholder={t('Nom complet')} className={fieldCls} />
                <input value={g.id_document_number || ''} onChange={(e) => upd(i, { id_document_number: e.target.value })} placeholder={t('N° de pièce')} className={fieldCls} />
                <label className="flex items-center gap-1 text-[12px] text-slate-600"><input type="checkbox" checked={!!g.is_child} onChange={(e) => upd(i, { is_child: e.target.checked })} /> {t('Enfant')}</label>
                <button type="button" onClick={() => setGuests(list.filter((_, k) => k !== i))} className="cursor-pointer border-none bg-transparent text-slate-400 hover:text-red-600" aria-label={t('Retirer')}><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </section>

          {isEarly && (
            <label className="mt-5 flex items-center gap-2 rounded-2xl border border-amber-100 bg-[#fff8ee] px-4 py-3 text-[13px] text-slate-600">
              <input type="checkbox" checked={early} onChange={(e) => setEarly(e.target.checked)} className="h-4 w-4" /> {t("L'arrivée est prévue le {date} : autoriser un check-in anticipé.", { date: formatDay(r.arrival_date) })}
            </label>
          )}
        </div>

        <aside className="space-y-4 lg:col-span-4">
          <CheckInPaymentCard r={r} canPay={can('payments.create')} onPay={() => setPaying(true)} />
          <CheckInRoomCard rooms={rooms} />
          <CheckInNote r={r} />
        </aside>
      </div>

      <div className="mt-6 flex items-center justify-end gap-6">
        <button type="button" onClick={() => navigate(`/reservations/${id}`)} className="cursor-pointer border-none bg-transparent text-[14px] font-medium text-slate-500">
          {t('Annuler')}
        </button>
        <button
          type="button"
          disabled={saving || notOpen || (isEarly && !early)}
          onClick={submit}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-[#0D1520] px-5 py-3 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? t('Chargement...') : <>{t('Valider le check-in')} <span>→</span></>}
        </button>
      </div>
      <PaymentFormModal isOpen={paying} onClose={() => setPaying(false)} reservation={r} onSaved={reload} />
    </>
  );
};

export default CheckInPage;
