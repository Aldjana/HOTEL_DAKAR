import { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, Lock, Search, Unlock } from 'lucide-react';
import { Button, ErrorState, Input, Modal, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { usePaymentMethods } from '../../../hooks/useReference';
import { cashApi } from '../../../services/api/cashApi';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { getErrorMessage } from '../../../services/api/client';
import { paymentMethodLabel } from '../../../constants/status';
import { addDaysStr, formatDay, formatMoney, formatNumber, fullName, todayStr } from '../../../utils/format';
import { useExport } from '../../payments/components/useExport';
import { modeClass, timeOf } from '../../payments/components/paymentsUi';
import CashMethodCard from '../components/CashMethodCard';
import { useT } from '../../../i18n';

const fmt = (n) => formatNumber(n);
const fieldCls = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none';

const CashPage = () => {
  const { can } = useAuth();
  const toast = useToast();
  const { t } = useT();
  const confirm = useConfirm();
  const methods = usePaymentMethods();
  const [date, setDate] = useState(todayStr());
  const [userId, setUserId] = useState('');
  const [method, setMethod] = useState('');
  const [term, setTerm] = useState('');
  const [closing, setClosing] = useState(false);
  const [counted, setCounted] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const exporter = useExport('cash', { date, user_id: userId, method });
  const { data: day, loading, error, reload } = useFetch(() => cashApi.daily({ date, user_id: userId || undefined, method: method || undefined }), [date, userId, method]);
  const { data: prev } = useFetch(() => cashApi.daily({ date: addDaysStr(date, -1) }), [date]);
  const { data: cashiers } = useFetch(() => cashApi.cashiers(), []);
  const { data: closures, reload: reloadClosures } = useFetch(() => cashApi.closures(), []);
  // Solde restant à encaisser : soldes des réservations dont le départ est prévu ce jour-là
  const { data: departures } = useFetch(() => reservationsApi.list({ departure_date: date, limit: 100, status: 'pending,confirmed,checked_in,checked_out' }).then((r) => r.items).catch(() => null), [date, day?.totals?.net_total]);
  const remaining = departures ? departures.reduce((s, r) => s + (Number(r.balance_amount) || 0), 0) : null;

  const doClose = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await cashApi.close({ date, counted_cash: counted === '' ? undefined : Number(counted), notes: notes || undefined }); toast.success(t('Caisse du {d} clôturée', { d: formatDay(date) })); setClosing(false); setCounted(''); setNotes(''); reload(); reloadClosures(); }
    catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };
  const reopen = async () => {
    if (!(await confirm({ title: t('Rouvrir la caisse ?'), message: t('La clôture du {d} sera supprimée : les paiements de ce jour redeviendront modifiables.', { d: formatDay(date) }), confirmLabel: t('Rouvrir'), danger: true }))) return;
    try { await cashApi.reopen(date); toast.success(t('Caisse rouverte')); reload(); reloadClosures(); } catch (err) { toast.error(getErrorMessage(err)); }
  };

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    const all = day?.payments || [];
    if (!t) return all;
    return all.filter((p) => [fullName(p.reservation_id?.client_id), p.reservation_id?.reservation_number, p.receipt_number, p.transaction_id, fullName(p.processed_by), paymentMethodLabel(p.payment_method, methods)].join(' ').toLowerCase().includes(t));
  }, [day, term, methods]);

  // Cartes de la maquette (espèces, Wave, OM, carte, virement) si actifs + tout autre mode ayant des encaissements ce jour
  const cardModes = useMemo(() => {
    const active = methods.map((m) => m.code);
    const codes = ['cash', 'wave', 'orange_money', 'credit_card', 'bank_transfer'].filter((c) => !active.length || active.includes(c));
    Object.keys(day?.by_method || {}).forEach((c) => { if (!codes.includes(c)) codes.push(c); });
    return codes;
  }, [methods, day]);
  const trend = day && prev && prev.totals.net_total > 0 ? Math.round(((day.totals.net_total - prev.totals.net_total) / prev.totals.net_total) * 100) : null;
  const totalStr = day ? fmt(day.totals.net_total) : '—';
  const [totA, ...totB] = totalStr.split(' ');

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 max-w-[520px] text-[28px] font-bold leading-tight">{t('Contrôlez les encaissements de la journée')}</h2>
          <p className="mt-2 max-w-[480px] text-[13px] text-slate-400">{t('Récapitulatif financier et gestion des flux de trésorerie en temps réel.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {exporter.allowed && (
            <>
              <button type="button" disabled={!!exporter.busy} onClick={() => exporter.run('pdf')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold disabled:opacity-50">
                <FileDown className="h-4 w-4" /> {t('Exporter PDF')}
              </button>
              <button type="button" disabled={!!exporter.busy} onClick={() => exporter.run('xlsx')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold disabled:opacity-50">
                <FileSpreadsheet className="h-4 w-4" /> {t('Exporter Excel')}
              </button>
            </>
          )}
          {can('cash.close') && day && (day.is_closed ? (
            <button type="button" onClick={reopen} className="inline-flex items-center gap-2 rounded-xl bg-[#d8f8ea] px-3 py-2 text-[13px] font-semibold text-[#0f9f6e]">
              <Unlock className="h-4 w-4" /> {t('Rouvrir la caisse')}
            </button>
          ) : (
            <button type="button" onClick={() => setClosing(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#d8f8ea] px-3 py-2 text-[13px] font-semibold text-[#0f9f6e]">
              <Lock className="h-4 w-4" /> {t('Clôturer la caisse')}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-[12px] text-slate-400">
        <input type="date" max={todayStr()} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} title={t('Date')} className={fieldCls} />
        <select value={userId} onChange={(e) => setUserId(e.target.value)} title={t('Caissier')} className={fieldCls}><option value="">{t('Tous les caissiers')}</option>{(cashiers || []).map((u) => <option key={u._id} value={u._id}>{fullName(u)}</option>)}</select>
        <select value={method} onChange={(e) => setMethod(e.target.value)} title={t('Mode')} className={fieldCls}><option value="">{t('Tous les modes')}</option>{methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}</select>
        {day && (day.is_closed
          ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{day.closure ? t('Journée clôturée par {name} · espèces comptées {cash} · écart {diff}', { name: fullName(day.closure.closed_by), cash: day.closure.counted_cash != null ? formatMoney(day.closure.counted_cash) : '—', diff: formatMoney(day.closure.difference) }) : t('Journée clôturée')}</span>
          : <span className="rounded-full bg-[#d8f8ea] px-2 py-0.5 text-[11px] font-semibold text-[#0f9f6e]">{t('Journée ouverte')}</span>)}
      </div>

      {loading && !day ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm xl:col-span-1">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-400">{t('Encaissement total')}</div>
              <div className="mt-2 text-[26px] font-bold leading-none">{totB.length ? <>{totA}<br />{totB.join(' ')}</> : totA} <span className="text-[12px] font-medium text-slate-400">FCFA</span></div>
              <div className={`mt-2 text-[12px] font-semibold ${trend != null && trend < 0 ? 'text-[#dc3b4e]' : 'text-[#0f9f6e]'}`}>{trend == null ? <span className="font-normal text-slate-400">—</span> : `${trend < 0 ? '↘' : '↗'} ${trend > 0 ? '+' : ''}${trend}%`}</div>
            </div>
            {cardModes.map((code) => (
              <CashMethodCard key={code} label={paymentMethodLabel(code, methods)} value={fmt(day.by_method[code]?.net || 0)} />
            ))}
            <CashMethodCard label={t('Paiements')} value={day.totals.count} suffix={t('Transactions')} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="m-0 text-[14px] font-semibold">{t('Détail des transactions')}</h3>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder={t('Rechercher...')} className="h-9 rounded-lg border border-slate-200 pl-8 pr-3 text-[12px] outline-none" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[13px]">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
                      <th className="py-2 font-semibold">{t('Heure')}</th>
                      <th className="py-2 font-semibold">{t('Client')}</th>
                      <th className="py-2 font-semibold">{t('Réservation')}</th>
                      <th className="py-2 font-semibold">{t('Montant')}</th>
                      <th className="py-2 font-semibold">{t('Mode')}</th>
                      <th className="py-2 font-semibold">{t('Utilisateur')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 && <tr className="border-t border-slate-100"><td colSpan={6} className="py-8 text-center text-slate-400">{t('Aucun encaissement ce jour-là')}</td></tr>}
                    {rows.map((p) => (
                      <tr key={p._id} className="border-t border-slate-100" title={p.receipt_number || p.transaction_id}>
                        <td className="py-3 text-slate-400">{timeOf(p.payment_date)}</td>
                        <td className="py-3 font-semibold">{fullName(p.reservation_id?.client_id) || '—'}</td>
                        <td className="py-3 text-slate-400">{p.reservation_id?.reservation_number || '—'}</td>
                        <td className={`py-3 font-bold ${p.type === 'refund' ? 'text-[#dc3b4e]' : ''}`}>{p.type === 'refund' ? '−' : ''}{fmt(p.amount)}</td>
                        <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${modeClass(p.payment_method)}`}>{paymentMethodLabel(p.payment_method, methods)}</span></td>
                        <td className="py-3">{p.processed_by?.first_name || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 text-[12px] text-slate-400">{t(rows.length > 1 ? 'Affichage de {n} transactions sur {total}' : 'Affichage de {n} transaction sur {total}', { n: rows.length, total: day.payments.length })}{day.voided_count > 0 && ` · ${t('{n} paiement(s) annulé(s), exclus des totaux', { n: day.voided_count })}`}</div>
            </section>

            <aside className="space-y-4 lg:col-span-4">
              <section className="rounded-2xl bg-[#0D1520] p-5 text-white">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t('Solde restant à encaisser')}</div>
                <div className="mt-3 text-[32px] font-bold leading-none">{remaining == null ? '—' : fmt(remaining)} <span className="text-[14px] font-medium">FCFA</span></div>
                <p className="mt-3 text-[12px] text-slate-400">{date === todayStr() ? t("Basé sur les départs prévus aujourd'hui.") : t('Basé sur les départs prévus le {d}.', { d: formatDay(date) })}</p>
              </section>
              <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h3 className="m-0 text-[14px] font-semibold">{t('Notes de caisse')}</h3>
                <textarea value={day.closure ? (day.closure.notes || '') : notes} onChange={(e) => setNotes(e.target.value)} readOnly={day.is_closed} className="mt-3 min-h-[90px] w-full rounded-lg border border-slate-200 p-3 text-[12px] outline-none" placeholder={t('Inscrivez ici les observations particulières...')} />
                <div className="mt-3 rounded-lg bg-[#fff8ee] p-3 text-[12px] text-amber-700">
                  <div className="font-semibold">{t('Rappel de procédure')}</div>
                  {t('Vérifiez systématiquement les reçus pour tout paiement par terminal de carte bancaire.')}
                </div>
                <button type="button" disabled={day.is_closed} onClick={() => toast.success(t('Note conservée : elle sera jointe à la clôture de la caisse.'))} className="mt-3 w-full rounded-lg border border-slate-200 bg-white py-2 text-[13px] font-semibold disabled:opacity-50">{t('Enregistrer la note')}</button>
              </section>
            </aside>
          </div>
        </>
      )}

      {(closures || []).length > 0 && (
        <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h3 className="m-0 mb-3 text-[14px] font-semibold">{t('Dernières clôtures')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
                  <th className="py-2 font-semibold">{t('Jour')}</th>
                  <th className="py-2 font-semibold">{t('Total net')}</th>
                  <th className="py-2 font-semibold">{t('Espèces attendues')}</th>
                  <th className="py-2 font-semibold">{t('Écart')}</th>
                  <th className="py-2 font-semibold">{t('Clôturé par')}</th>
                </tr>
              </thead>
              <tbody>
                {closures.map((c) => (
                  <tr key={c._id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => setDate(c.date)}>
                    <td className="py-3 font-semibold">{formatDay(c.date)}</td>
                    <td className="py-3 font-bold">{formatMoney(c.net_total)}</td>
                    <td className="py-3">{formatMoney(c.expected_cash)}</td>
                    <td className="py-3">{c.counted_cash == null ? '—' : <span className={c.difference !== 0 ? 'font-semibold text-[#dc3b4e]' : ''}>{formatMoney(c.difference)}</span>}</td>
                    <td className="py-3">{fullName(c.closed_by) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <Modal isOpen={closing} onClose={() => setClosing(false)} title={t('Clôturer la caisse du {d}', { d: formatDay(date) })} size="sm">
        <form onSubmit={doClose}>
          <p className="mb-3 text-sm text-slate-600">{t('Espèces attendues :')} <b>{formatMoney(day?.totals.cash_expected)}</b>. {t('Après clôture, les paiements de ce jour ne peuvent plus être créés ni modifiés.')}</p>
          <Input label={t('Espèces comptées (optionnel)')} type="number" min="0" value={counted} onChange={(e) => setCounted(e.target.value)} />
          <Input label={t('Notes')} multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setClosing(false)}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Clôturer')}</Button></div>
        </form>
      </Modal>
    </>
  );
};

export default CashPage;
