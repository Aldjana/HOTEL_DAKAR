import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, CircleAlert, CreditCard, Plus, Tag, Trash2, User } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useApp } from '../../../context/AppContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { roomsApi } from '../../../services/api/roomsApi';
import { getErrorMessage } from '../../../services/api/client';
import { usePaymentMethods, useReservationSources } from '../../../hooks/useReference';
import { addDaysStr, formatMoney, fullName, nightsBetween, todayStr, toInputDate } from '../../../utils/format';
import { CLIENT_TYPE_LABELS } from '../../../constants/status';
import ClientPicker from './ClientPicker';
import { getLocale, useT } from '../../../i18n';


const Field = ({ label, error, children }) => (
  <div className="block">
    <span className="mb-1.5 block text-[12px] text-slate-500">{label}</span>
    {children}
    {error && <span className="mt-1 block text-[12px] text-red-600">{error}</span>}
  </div>
);

const inputClass =
  'h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-800 outline-none placeholder:text-slate-300 focus:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400';
const textareaClass = 'min-h-[88px] w-full rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none placeholder:text-slate-300';

// Formulaire partagé création / modification de réservation.
const ReservationForm = ({ reservation = null, initial = {} }) => {
  const { t } = useT();
  const editing = !!reservation;
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();
  const { settings } = useApp();
  const sources = useReservationSources();
  const methods = usePaymentMethods();
  const live = reservation?.status === 'checked_in';
  const canOverride = can('reservations.price_override');

  const [client, setClient] = useState(reservation?.client_id || initial.client || null);
  const [form, setForm] = useState({
    arrival_date: reservation ? toInputDate(reservation.arrival_date) : (initial.arrival_date || todayStr()),
    departure_date: reservation ? toInputDate(reservation.departure_date) : (initial.departure_date || addDaysStr(initial.arrival_date || todayStr(), 1)),
    adults_count: reservation?.adults_count ?? 1,
    children_count: reservation?.children_count ?? 0,
    source: reservation?.source || 'direct',
    discount_amount: reservation?.discount_amount || '',
    discount_reason: reservation?.discount_reason || '',
    apply_taxes: reservation ? reservation.apply_taxes !== false : true,
    special_requests: reservation?.special_requests || '',
    notes: reservation?.notes || '',
  });
  const [selected, setSelected] = useState(() => {
    if (reservation) return (reservation.rooms?.length ? reservation.rooms : [{ room_id: reservation.room_id?._id || reservation.room_id, nightly_rate: reservation.subtotal_amount / Math.max(reservation.nights, 1) }]).map((l) => ({ room_id: String(l.room_id?._id || l.room_id), rate: l.nightly_rate, custom: false }));
    return initial.room_id ? [{ room_id: initial.room_id, rate: null, custom: false }] : [];
  });
  const [guests, setGuests] = useState(reservation?.guests || []);
  const [payment, setPayment] = useState({ amount: '', payment_method: 'cash', reference: '' });
  const [advance, setAdvance] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const defaultStatus = reservation?.status === 'pending' ? 'pending' : 'confirmed';
  const [available, setAvailable] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});

  const nights = nightsBetween(form.arrival_date, form.departure_date);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  // Chambres disponibles sur la période choisie (la réservation en cours de modification est exclue du calcul)
  useEffect(() => {
    if (live || nights < 1) { setAvailable([]); return undefined; }
    let alive = true;
    setLoadingRooms(true);
    roomsApi.available({ start_date: form.arrival_date, end_date: form.departure_date, exclude_reservation_id: reservation?._id })
      .then((r) => { if (alive) setAvailable(r); })
      .catch((err) => { if (alive) { setAvailable([]); setError(getErrorMessage(err)); } })
      .finally(() => alive && setLoadingRooms(false));
    return () => { alive = false; };
  }, [form.arrival_date, form.departure_date, nights, reservation?._id, live]);

  const roomById = useMemo(() => Object.fromEntries(available.map((r) => [String(r._id), r])), [available]);
  // Les chambres déjà sélectionnées qui ne sont plus listées (ex. séjour en cours) restent affichables
  const knownRooms = useMemo(() => {
    const m = { ...roomById };
    (reservation?.room_details || []).forEach((r) => { m[String(r._id)] = { ...r, type: r.type || r.room_type_id, price: r.base_price }; });
    return m;
  }, [roomById, reservation]);

  useEffect(() => { // retire les chambres devenues indisponibles après changement de dates
    if (live || loadingRooms || !available.length) return;
    setSelected((s) => s.filter((x) => roomById[x.room_id] || (editing && (reservation.room_details || []).some((r) => String(r._id) === x.room_id) && !available.length)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [available]);

  const toggleRoom = (room) => setSelected((s) => (s.some((x) => x.room_id === String(room._id)) ? s.filter((x) => x.room_id !== String(room._id)) : [...s, { room_id: String(room._id), rate: null, custom: false }]));
  const rateOf = (x) => (x.custom && x.rate !== '' && x.rate !== null ? Number(x.rate) : (knownRooms[x.room_id]?.base_price ?? x.rate ?? 0));

  const estimate = useMemo(() => {
    const subtotal = selected.reduce((s, x) => s + rateOf(x) * Math.max(nights, 0), 0);
    const discount = Math.min(Number(form.discount_amount) || 0, subtotal);
    const base = subtotal - discount;
    const vat = form.apply_taxes ? Math.round((base * (settings?.vat_rate || 0)) / 100) : 0;
    const stay = form.apply_taxes ? Math.round((settings?.stay_tax || 0) * Number(form.adults_count || 0) * Math.max(nights, 0)) : 0;
    return { subtotal, discount, vat, stay, total: base + vat + stay };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, nights, form.discount_amount, form.apply_taxes, form.adults_count, settings, knownRooms]);

  const validate = () => {
    const e = {};
    if (!client) e.client = t('Sélectionnez un client');
    if (!form.arrival_date) e.arrival_date = t("Date d'arrivée requise");
    if (nights < 1) e.departure_date = t("Le départ doit être après l'arrivée");
    if (!editing && form.arrival_date < todayStr()) e.arrival_date = t("L'arrivée ne peut pas être dans le passé");
    if (!(Number(form.adults_count) >= 1)) e.adults_count = t('Au moins 1 adulte');
    if (selected.length === 0) e.rooms = t('Choisissez au moins une chambre');
    if (Number(form.discount_amount) < 0) e.discount_amount = t('Remise invalide');
    if (!editing && payment.amount && Number(payment.amount) > estimate.total) e.payment = t('Avance supérieure au total du séjour');
    const m = methods.find((x) => x.code === payment.payment_method);
    if (!editing && Number(payment.amount) > 0 && m?.requires_reference && !payment.reference.trim()) e.payment = t('Référence requise pour « {name} »', { name: m.name });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (status = defaultStatus, { requireAdvance = false } = {}) => {
    setError('');
    if (!validate()) return;
    if (requireAdvance && !(Number(payment.amount) > 0)) { setErrors((e) => ({ ...e, payment: t("Saisissez le montant de l'avance à encaisser") })); return; }
    const body = {
      client_id: client._id,
      arrival_date: form.arrival_date, departure_date: form.departure_date,
      adults_count: Number(form.adults_count), children_count: Number(form.children_count) || 0,
      source: form.source, status,
      discount_amount: Number(form.discount_amount) || 0, discount_reason: form.discount_reason || undefined,
      apply_taxes: form.apply_taxes, special_requests: form.special_requests, notes: form.notes,
      guests: guests.filter((g) => g.full_name?.trim()),
    };
    if (!live) {
      body.rooms = selected.map((x) => {
        const line = { room_id: x.room_id };
        if (x.custom && x.rate !== '' && x.rate !== null && Number(x.rate) !== knownRooms[x.room_id]?.base_price) line.nightly_rate = Number(x.rate);
        return line;
      });
    }
    if (live) delete body.status;
    if (!editing && Number(payment.amount) > 0) body.initial_payment = { amount: Number(payment.amount), payment_method: payment.payment_method, reference: payment.reference || undefined };
    setSaving(true);
    try {
      const saved = editing ? await reservationsApi.update(reservation._id, body) : await reservationsApi.create(body);
      toast.success(editing ? t('Réservation mise à jour') : t('Réservation {n} créée', { n: saved.reservation_number }));
      navigate(`/reservations/${saved._id}`);
    } catch (err) {
      setError(getErrorMessage(err, t('Enregistrement impossible')));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally { setSaving(false); }
  };

  const typeNames = useMemo(() => [...new Set(available.map((r) => r.type?.name).filter(Boolean))], [available]);
  const pickable = available.filter((r) => !selected.some((x) => x.room_id === String(r._id)) && (!typeFilter || r.type?.name === typeFilter));
  const nightlyTotal = selected.reduce((s, x) => s + rateOf(x), 0);
  const roomLabel = selected.length
    ? `${[...new Set(selected.map((x) => knownRooms[x.room_id]?.type?.name).filter(Boolean))].join(' / ')} #${selected.map((x) => knownRooms[x.room_id]?.room_number || '…').join(', ')}`.trim()
    : '—';
  const categoryLabel = [...new Set(selected.map((x) => knownRooms[x.room_id]?.type?.name).filter(Boolean))].join(' / ') || '—';
  const paidAlready = editing ? Number(reservation.paid_amount) || 0 : (advance ? Number(payment.amount) || 0 : 0);
  const balance = estimate.total - paidAlready;
  const shortDate = (d) => (d ? new Date(`${d}T00:00:00Z`).toLocaleDateString(getLocale(), { day: 'numeric', month: 'short', timeZone: 'UTC' }) : '—');
  const clientType = client?.client_type ? (CLIENT_TYPE_LABELS[client.client_type] || client.client_type) : '';
  const hasTaxes = (settings?.vat_rate > 0) || (settings?.stay_tax > 0);
  const ro = `${inputClass} bg-slate-50`;

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-5 lg:col-span-8">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-slate-800">
            <User className="h-4 w-4 text-slate-500" />
            {t('Section 1: Informations client')}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Field label={t('Client')}>
                <ClientPicker value={client} onChange={setClient} error={errors.client} />
              </Field>
            </div>
            <Field label={t('Prénom')}><input className={ro} placeholder={t('Ex: Moussa')} value={client?.first_name || ''} readOnly /></Field>
            <Field label={t('Nom')}><input className={ro} placeholder={t('Ex: Diop')} value={client?.last_name || ''} readOnly /></Field>
            <Field label={t('Téléphone')}><input className={ro} placeholder="+221 7x xxx xx xx" value={client?.phone || ''} readOnly /></Field>
            <Field label={t('Email')}><input className={ro} type="email" placeholder={t('Rempli depuis la fiche client')} value={client?.email || ''} readOnly /></Field>
            <Field label={t('Type client')}><input className={ro} placeholder={t('Rempli depuis la fiche client')} value={clientType} readOnly /></Field>
            <Field label={t('Nationalité')}><input className={ro} placeholder={t('Rempli depuis la fiche client')} value={client?.nationality || ''} readOnly /></Field>
            <div className="md:col-span-2">
              <Field label={t('ID (Passeport / CNI)')}><input className={ro} placeholder={t('Numéro de document')} value={client?.id_document_number || ''} readOnly /></Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-slate-800">
            <CalendarDays className="h-4 w-4 text-slate-500" />
            {t('Section 2: Séjour')}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label={t('Date arrivée')} error={errors.arrival_date}>
              <input className={inputClass} type="date" required disabled={live} min={editing ? undefined : todayStr()} value={form.arrival_date} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, arrival_date: v, departure_date: f.departure_date <= v ? addDaysStr(v, 1) : f.departure_date })); }} />
            </Field>
            <Field label={t('Départ')} error={errors.departure_date}>
              <input className={inputClass} type="date" required min={addDaysStr(form.arrival_date || todayStr(), 1)} value={form.departure_date} onChange={set('departure_date')} />
            </Field>
            <Field label={t('Nuits')}>
              <input className={ro} value={Math.max(nights, 0)} readOnly />
            </Field>
            <Field label={t('Adultes')} error={errors.adults_count}>
              <input className={inputClass} type="number" min="1" required value={form.adults_count} onChange={set('adults_count')} />
            </Field>
            <Field label={t('Enfants')}>
              <input className={inputClass} type="number" min="0" value={form.children_count} onChange={set('children_count')} />
            </Field>
            <Field label={t('Source')}>
              <select className={inputClass} value={form.source} onChange={set('source')}>
                {(sources.length ? sources : [{ code: 'direct', name: 'Direct / Walk-in' }]).map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </Field>
            {live ? (
              <div className="md:col-span-3">
                <Field label={t('Chambre(s) du séjour en cours')}>
                  <div className="text-[13px] text-slate-600">{t("Le séjour est en cours : pour changer de chambre, utilisez l'action « Changer de chambre » depuis la fiche de la réservation.")}</div>
                </Field>
              </div>
            ) : (
              <>
                <Field label={t('Type chambre')}>
                  <select className={inputClass} value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="">{t('Tous les types')}</option>
                    {typeNames.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <div className="md:col-span-2">
                  <Field label={`${t('Chambre dispo')}${loadingRooms ? ' …' : ''}`} error={errors.rooms}>
                    <select className={inputClass} value="" onChange={(e) => { const r = available.find((x) => String(x._id) === e.target.value); if (r) toggleRoom(r); }} disabled={nights < 1}>
                      <option value="">{nights < 1 ? t('Choisissez des dates valides') : pickable.length === 0 && !loadingRooms ? t('Aucune chambre disponible') : t('Ajouter une chambre…')}</option>
                      {pickable.map((r) => <option key={r._id} value={r._id}>{r.room_number} - ({r.status === 'cleaning' ? t('À nettoyer') : t('Libre')}) · {t('{price} / nuit', { price: formatMoney(r.base_price) })}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}
            {selected.length > 0 && (
              <div className="space-y-2 md:col-span-3">
                {selected.map((x) => {
                  const r = knownRooms[x.room_id];
                  return (
                    <div key={x.room_id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                      <span className="w-28 font-semibold text-slate-800">{t('Chambre {n}', { n: r?.room_number || '…' })}</span>
                      {canOverride && !live ? (
                        <label className="flex items-center gap-2 text-slate-500">{t('Tarif/nuit')}
                          <input type="number" min="0" value={x.custom ? x.rate : (r?.base_price ?? '')} onChange={(e) => setSelected((s) => s.map((y) => (y.room_id === x.room_id ? { ...y, custom: true, rate: e.target.value } : y)))} className="h-8 w-28 rounded-lg border border-slate-200 bg-white px-2 text-[13px] outline-none" />
                        </label>
                      ) : <span className="text-slate-500">{t('{price} / nuit', { price: formatMoney(rateOf(x)) })}</span>}
                      <span className="ml-auto font-medium text-slate-800">{formatMoney(rateOf(x) * Math.max(nights, 0))}</span>
                      {!live && <button type="button" onClick={() => setSelected((s) => s.filter((y) => y.room_id !== x.room_id))} className="text-slate-400 hover:text-red-600" aria-label={t('Retirer la chambre')}><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  );
                })}
              </div>
            )}
            <div className="md:col-span-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[12px] text-slate-500">{t('Personnes supplémentaires')}</span>
                <button type="button" onClick={() => setGuests([...guests, { full_name: '' }])} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-[12px] font-semibold text-slate-700"><Plus className="h-3.5 w-3.5" /> {t('Ajouter')}</button>
              </div>
              {guests.length === 0 ? <p className="m-0 text-[12px] text-slate-400">{t('Aucune personne supplémentaire renseignée (optionnel).')}</p> : guests.map((g, i) => (
                <div key={i} className="mb-2 flex items-center gap-2">
                  <input value={g.full_name} onChange={(e) => setGuests(guests.map((x, j) => (j === i ? { ...x, full_name: e.target.value } : x)))} placeholder={t('Nom complet')} className={`${inputClass} flex-1`} />
                  <input value={g.id_document_number || ''} onChange={(e) => setGuests(guests.map((x, j) => (j === i ? { ...x, id_document_number: e.target.value } : x)))} placeholder={t("N° pièce d'identité")} className={`${inputClass} !w-48`} />
                  <button type="button" onClick={() => setGuests(guests.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-600" aria-label={t('Retirer')}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-slate-800">
            <Tag className="h-4 w-4 text-slate-500" />
            {t('Section 3: Tarification')}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label={t('Prix/nuit (FCFA)')}>
              <input className={ro} value={Math.round(nightlyTotal).toLocaleString(getLocale())} readOnly />
            </Field>
            <Field label={t('Remise (FCFA)')} error={errors.discount_amount}>
              <input className={inputClass} type="number" min="0" value={form.discount_amount} onChange={set('discount_amount')} />
            </Field>
            <Field label={t('Total (FCFA)')}>
              <input className={`${ro} font-semibold`} value={Math.round(estimate.total).toLocaleString(getLocale())} readOnly />
            </Field>
            <Field label={t('Taxe de séjour incluse ?')}>
              <label className="flex h-11 items-center gap-2 text-[13px] text-slate-700">
                <input type="checkbox" checked={form.apply_taxes} onChange={set('apply_taxes')} disabled={!hasTaxes} />
                {t('Oui')}{settings?.stay_tax > 0 ? ` (${t('{n} FCFA/pers', { n: settings.stay_tax })})` : ''}{settings?.vat_rate > 0 ? ` · ${t('TVA {rate}%', { rate: settings.vat_rate })}` : ''}
              </label>
            </Field>
            {Number(form.discount_amount) > 0 && (
              <div className="md:col-span-2">
                <Field label={t('Motif de la remise')}>
                  <input className={inputClass} value={form.discount_reason} onChange={set('discount_reason')} />
                </Field>
              </div>
            )}
            <div className="md:col-span-2">
              <Field label={t('Demandes spéciales')}>
                <textarea className={textareaClass} rows={2} value={form.special_requests} onChange={set('special_requests')} placeholder={t('Demandes particulières, allergies, etc...')} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label={t('Notes')}>
                <textarea className={textareaClass} rows={2} value={form.notes} onChange={set('notes')} placeholder={t('Notes internes')} />
              </Field>
            </div>
          </div>
        </section>

        {!editing && (
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-slate-800">
              <CreditCard className="h-4 w-4 text-slate-500" />
              {t('Section 4: Paiement initial')}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[12px] text-slate-500">{t('Avance reçue')}</div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAdvance(true)} className={`rounded-md border px-4 py-1.5 text-[13px] ${advance ? 'border-[#0D1520] bg-[#0D1520] text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{t('Oui')}</button>
                  <button type="button" onClick={() => { setAdvance(false); setPayment({ ...payment, amount: '', reference: '' }); }} className={`rounded-md border px-4 py-1.5 text-[13px] ${!advance ? 'border-[#0D1520] bg-[#0D1520] text-white' : 'border-slate-200 bg-white text-slate-600'}`}>{t('Non')}</button>
                </div>
              </div>
              <Field label={t('Montant (FCFA)')}>
                <input className={inputClass} type="number" min="0" disabled={!advance} value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} />
              </Field>
              <Field label={t('Mode de paiement')}>
                <select className={inputClass} disabled={!advance} value={payment.payment_method} onChange={(e) => setPayment({ ...payment, payment_method: e.target.value })}>
                  {methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}
                </select>
              </Field>
              <Field label={t('Référence')}>
                <input className={inputClass} disabled={!advance} placeholder={t('ID Transaction / N° Chèque')} value={payment.reference} onChange={(e) => setPayment({ ...payment, reference: e.target.value })} />
              </Field>
              {errors.payment && <span className="block text-[12px] text-red-600 md:col-span-2">{errors.payment}</span>}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3 pb-6">
          <button type="button" onClick={() => navigate(editing ? `/reservations/${reservation._id}` : '/reservations')} className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700">
            {t('Annuler')}
          </button>
          {!editing && (
            <button type="button" disabled={saving} onClick={() => submit('pending')} className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-700 disabled:opacity-60">
              {t('Enregistrer option')}
            </button>
          )}
          <button type="button" disabled={saving} onClick={() => submit(editing ? defaultStatus : 'confirmed')} className="rounded-lg bg-[#0D1520] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
            {editing ? t('Enregistrer') : t('Confirmer')}
          </button>
          {editing && !live && defaultStatus === 'pending' && (
            <button type="button" disabled={saving} onClick={() => submit('confirmed')} className="rounded-lg bg-[#0D1520] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
              {t('Confirmer')}
            </button>
          )}
          {!editing && (
            <button type="button" disabled={saving} onClick={() => { setAdvance(true); submit('confirmed', { requireAdvance: true }); }} className="rounded-lg bg-[#0D1520] px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60">
              {t('Confirmer et encaisser')}
            </button>
          )}
        </div>
      </div>

      <aside className="space-y-4 lg:col-span-4">
        <section className="overflow-hidden rounded-2xl bg-[#0D1520] p-5 text-white shadow-sm">
          <h2 className="mb-5 text-[16px] font-semibold">{t('Résumé')}</h2>
          <div className="space-y-3 text-[12px]">
            <div className="flex items-start justify-between gap-3">
              <span className="uppercase tracking-[0.12em] text-slate-400">{t('Client')}</span>
              <span className="text-right font-semibold">{client ? fullName(client) : '—'}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="uppercase tracking-[0.12em] text-slate-400">{t('Chambre')}</span>
              <span className="text-right font-semibold">{roomLabel}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span className="uppercase tracking-[0.12em] text-slate-400">{t('Période')}</span>
              <span className="text-right font-semibold">
                {shortDate(form.arrival_date)} — {shortDate(form.departure_date)}
                <div className="text-[11px] font-medium text-[#ef4444]">{t(nights > 1 ? '{n} Nuits' : '{n} Nuit', { n: Math.max(nights, 0) })}</div>
              </span>
            </div>
            {(estimate.discount > 0 || estimate.vat > 0 || estimate.stay > 0) && (
              <div className="space-y-1 border-t border-white/10 pt-3 text-slate-300">
                <div className="flex items-center justify-between"><span>{t('Hébergement')}</span><span>{formatMoney(estimate.subtotal)}</span></div>
                {estimate.discount > 0 && <div className="flex items-center justify-between"><span>{t('Remise')}</span><span>-{formatMoney(estimate.discount)}</span></div>}
                {estimate.vat > 0 && <div className="flex items-center justify-between"><span>{t('TVA ({rate}%)', { rate: settings?.vat_rate })}</span><span>{formatMoney(estimate.vat)}</span></div>}
                {estimate.stay > 0 && <div className="flex items-center justify-between"><span>{t('Taxe de séjour')}</span><span>{formatMoney(estimate.stay)}</span></div>}
              </div>
            )}
            <div className="pt-2">
              <div className="uppercase tracking-[0.12em] text-slate-400">{t('Total')}</div>
              <div className="mt-1 text-[28px] font-bold leading-none">{formatMoney(estimate.total)}</div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="uppercase tracking-[0.12em] text-slate-400">{editing ? t('Déjà réglé') : t('Avance')}</span>
              <span className="font-semibold">{formatMoney(paidAlready)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.12em] text-[#ef4444]">{t('Solde restant')}</span>
              <span className="font-semibold text-[#10B981]">{formatMoney(balance)}</span>
            </div>
            <p className="m-0 pt-1 text-[11px] text-slate-500">{t("Montant estimé ; le total définitif est calculé par le serveur à l'enregistrement.")}</p>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80"
              alt={t('Chambre')}
              className="h-36 w-full object-cover"
              onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }}
            />
            <div className="flex items-center gap-2 bg-[#152536] px-3 py-2 text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              {t('Catégorie: {cat}', { cat: categoryLabel })}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-[#f3f4f6] p-4">
          <h3 className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-slate-800">
            <CircleAlert className="h-4 w-4 text-amber-500" />
            {t("Note de l'établissement")}
          </h3>
          <p className="m-0 text-[12px] leading-5 text-slate-500">
            {t("Le check-in est à partir de 14h00. Veuillez vous assurer que le document d'identité est scanné lors de l'arrivée physique du client. Les remises de plus de 15% nécessitent une validation manager.")}
          </p>
        </section>
      </aside>
    </form>
  );
};

export default ReservationForm;
