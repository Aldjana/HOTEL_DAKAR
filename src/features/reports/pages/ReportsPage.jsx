import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useT, tr } from '../../../i18n';
import { BedDouble, CalendarDays, CircleDollarSign, Download, FileDown, Receipt, BarChart3, Wallet, Activity, Earth, Globe, PersonStanding } from 'lucide-react';
import { CategoryScale, Chart as ChartJS, LineElement, PointElement, LinearScale, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ErrorState, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useFetch } from '../../../hooks/useFetch';
import { usePaymentMethods, useReservationSources } from '../../../hooks/useReference';
import { reportsApi } from '../../../services/api/reportsApi';
import { paymentsApi } from '../../../services/api/paymentsApi';
import { downloadFile } from '../../../services/download';
import { getErrorMessage } from '../../../services/api/client';
import { PAYMENT_STATUS_LABELS, RESERVATION_STATUS_LABELS, paymentMethodLabel } from '../../../constants/status';
import { addDaysStr, formatDay, formatMoney, formatNumber, fullName, initials, nightsBetween, todayStr } from '../../../utils/format';
import RevenueChart from '../components/RevenueChart';
import ReportFilterSelector, { ReportFilterDate } from '../components/ReportFilterSelector';
import PaymentModeCard from '../components/PaymentModeCard';
import ReportTabs from '../components/ReportTabs';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Filler);

const TABS = [
  { id: 'overview', label: "Vue d'ensemble", icon: BarChart3 },
  { id: 'occupancy', label: 'Occupation', icon: BedDouble },
  { id: 'receivables', label: 'Créances', icon: Wallet },
  { id: 'usage', label: 'Utilisation', icon: Activity },
];
const EXPORT_TYPE = { overview: 'payments', occupancy: 'occupancy', receivables: 'receivables', usage: null };
const MODE_BORDERS = ['border-l-[#10B981]', 'border-l-blue-500', 'border-l-orange-400', 'border-l-slate-300'];
const CHANNEL_STYLES = [['bg-[#006C49] text-white', 'bg-[#006C49]'], ['bg-[#0D1520] text-white', 'bg-[#0D1520]'], ['bg-slate-300 text-slate-500', 'bg-slate-300']];
const CHANNEL_GLYPHS = [Earth, Globe, PersonStanding];
const monthStart = () => `${todayStr().slice(0, 8)}01`;
const presetRange = (p) => {
  const t = todayStr();
  if (p === 'month') return { from: monthStart(), to: t };
  const n = { '7': 6, '30': 29, '90': 89 }[p];
  return { from: addDaysStr(t, -n), to: t };
};
// Fin du mois de `d` ('YYYY-MM-DD'), en UTC comme le reste des dates calendaires.
const monthEnd = (d) => new Date(Date.UTC(Number(d.slice(0, 4)), Number(d.slice(5, 7)), 0)).toISOString().slice(0, 10);
const short = (d) => `${d.slice(8)}/${d.slice(5, 7)}`;
const pct = (n, total) => (total > 0 ? Math.round((n / total) * 100) : 0);
const delta = (cur, prev) => (prev > 0 ? ((cur - prev) / prev) * 100 : null);
const Delta = ({ value }) => (value == null ? null : (
  <span className={`text-[12px] font-semibold ${value >= 0 ? 'text-[#0f9f6e]' : 'text-red-400'}`}>{value >= 0 ? '+' : '-'}{Math.abs(value).toFixed(1)}%</span>
));

const CARD = 'rounded-2xl border border-slate-100 bg-white p-4 shadow-sm';
const TH = 'py-2 font-semibold';

// Liste à barres (style « répartition par canal » d'origine)
const Breakdown = ({ title, entries, fmt = formatNumber, className = '' }) => {
  const { t } = useT();
  const total = entries.reduce((s, [, v]) => s + v, 0) || 1;
  return (
    <section className={`${CARD} ${className}`}>
      <h3 className="mb-3 mt-0 text-[14px] font-semibold">{t(title)}</h3>
      {entries.length === 0 ? <p className="m-0 text-[13px] text-slate-400">{t('Aucune donnée sur la période')}</p> : (
        <div className="space-y-4">
          {entries.map(([k, v]) => (
            <div key={k}>
              <div className="mb-1 flex items-center justify-between text-[13px]"><span>{k}</span><span className="font-semibold">{fmt(v)}</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-slate-800" style={{ width: `${Math.max((v / total) * 100, 2)}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const ReportsPage = () => {
  const { t } = useT();
  const { can } = useAuth();
  const toast = useToast();
  const methods = usePaymentMethods();
  const sources = useReservationSources();
  const [showAllChannels, setShowAllChannels] = useState(false);
  const [tab, setTab] = useState('overview');
  const [draft, setDraft] = useState({ preset: 'month', ...presetRange('month') });
  const [applied, setApplied] = useState({ from: monthStart(), to: todayStr() });
  const [busy, setBusy] = useState('');
  const { from, to } = applied;
  const range = { from, to };
  const invalid = draft.from > draft.to;
  const appliedInvalid = from > to;

  const days = nightsBetween(from, to) + 1;
  const prevTo = addDaysStr(from, -1);
  const prevRange = { from: addDaysStr(prevTo, -(days - 1)), to: prevTo };

  const ok = !appliedInvalid;
  // Période = un mois calendaire (ex. « Ce mois ») : le graphique couvre tout le mois, jours futurs en prévisionnel.
  const forecastTo = from === `${to.slice(0, 8)}01` && monthEnd(to) > todayStr() ? monthEnd(to) : undefined;
  const overview = useFetch(() => reportsApi.overview({ ...range, forecast_to: forecastTo }), [from, to], { enabled: tab === 'overview' && ok });
  const prev = useFetch(() => reportsApi.overview(prevRange), [from, to], { enabled: tab === 'overview' && ok });
  const recent = useFetch(() => paymentsApi.list({ limit: 5, from, to }), [from, to], { enabled: tab === 'overview' && ok && can('payments.read') });
  const occ = useFetch(() => reportsApi.occupancy(range), [from, to], { enabled: tab === 'occupancy' && ok });
  const rec = useFetch(() => reportsApi.receivables(), [], { enabled: tab === 'receivables' || tab === 'overview' });
  const usage = useFetch(() => reportsApi.usage(range), [from, to], { enabled: tab === 'usage' && ok });
  const cur = { overview, occupancy: occ, receivables: rec, usage }[tab];
  const o = overview.data;
  const po = prev.data;
  const exportType = EXPORT_TYPE[tab];
  const sourceName = (code) => sources.find((s) => s.code === code)?.name || code;

  const setPreset = (e) => {
    const preset = e.target.value;
    setDraft(preset === 'custom' ? { ...draft, preset } : { preset, ...presetRange(preset) });
  };
  const apply = () => { if (!invalid) setApplied({ from: draft.from, to: draft.to }); };
  const exportTo = async (format) => {
    setBusy(format);
    try { await downloadFile(`/reports/export/${exportType}`, { ...(tab === 'receivables' ? {} : range), format }, `${exportType}.${format}`); }
    catch (err) { toast.error(getErrorMessage(err, tr('Export impossible'))); } finally { setBusy(''); }
  };

  const booked = o ? Object.values(o.revenue_by_room_type).reduce((s, v) => s + v, 0) : 0;
  const prevBooked = po ? Object.values(po.revenue_by_room_type).reduce((s, v) => s + v, 0) : 0;
  const sourceEntries = o ? Object.entries(o.by_source).sort((a, b) => b[1] - a[1]) : [];
  const sourceTotal = sourceEntries.reduce((s, [, v]) => s + v, 0);
  const modeEntries = o ? Object.entries(o.revenue_by_method).sort((a, b) => b[1] - a[1]) : [];
  const modeTotal = modeEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[28px] font-bold">{t('Analysez les performances')}</h2>
          <p className="mt-1 text-[13px] text-slate-400">{t('Aperçu analytique de l\'établissement pour la période sélectionnée.')}</p>
        </div>
        {exportType && can('exports.read') && (
          <div className="flex gap-2">
            <button type="button" disabled={!!busy} onClick={() => exportTo('pdf')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
              <FileDown className="h-4 w-4" /> {busy === 'pdf' ? t('Chargement...') : t('Exporter PDF')}
            </button>
            <button type="button" disabled={!!busy} onClick={() => exportTo('xlsx')} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
              <Download className="h-4 w-4" /> {busy === 'xlsx' ? t('Chargement...') : 'Excel'}
            </button>
          </div>
        )}
      </div>

      <ReportTabs tabs={TABS} activeTab={tab} onTabChange={setTab} />

      {tab !== 'receivables' && (
        <div className="mb-5 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <ReportFilterSelector label={t('Période')} value={draft.preset} onChange={setPreset}>
            <option value="month">{t('Ce mois-ci')}</option>
            <option value="7">{t('7 derniers jours')}</option>
            <option value="30">{t('30 derniers jours')}</option>
            <option value="90">{t('90 derniers jours')}</option>
            <option value="custom">{t('Personnalisée')}</option>
          </ReportFilterSelector>
          <ReportFilterDate label={t('Du')} value={draft.from} max={draft.to} onChange={(e) => e.target.value && setDraft({ ...draft, preset: 'custom', from: e.target.value })} />
          <ReportFilterDate label={t('Au')} value={draft.to} min={draft.from} onChange={(e) => e.target.value && setDraft({ ...draft, preset: 'custom', to: e.target.value })} />
          <button type="button" onClick={apply} disabled={invalid} className="h-10 rounded-lg bg-[#0D1520] px-4 text-[13px] font-semibold text-white disabled:opacity-60">{t('Appliquer')}</button>
        </div>
      )}

      {tab !== 'receivables' && (invalid || appliedInvalid) && <ErrorState message={t('La date de début doit précéder la date de fin.')} />}
      {!(tab !== 'receivables' && (invalid || appliedInvalid)) && (cur.loading && !cur.data ? <Spinner /> : cur.error ? <ErrorState message={cur.error} onRetry={cur.reload} /> : cur.data && (
        <>
          {tab === 'overview' && o && (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className={CARD}>
                  <div className="flex items-center justify-between">
                    <CircleDollarSign className="h-8 w-8 rounded-lg bg-[#e8f8f1] p-1.5 text-[#0f9f6e]" />
                    <Delta value={delta(booked, prevBooked)} />
                  </div>
                  <div className="mt-4 text-[11px] font-semibold uppercase text-slate-400">{t('CA de la période')}</div>
                  <div className="text-[26px] font-bold">{formatNumber(booked)}</div>
                  <div className="text-[12px] text-slate-400">{po ? t('FCFA vs {n} FCFA (période préc.)', { n: formatNumber(prevBooked) }) : 'FCFA'}</div>
                </div>
                <div className={CARD}>
                  <div className="flex items-center justify-between">
                    <BedDouble className="h-8 w-8 rounded-lg bg-slate-100 p-1.5 text-slate-500" />
                    <Delta value={po ? delta(o.occupancy_rate, po.occupancy_rate) : null} />
                  </div>
                  <div className="mt-4 text-[11px] font-semibold uppercase text-slate-400">{t('Occupation moyenne')}</div>
                  <div className="text-[26px] font-bold">{o.occupancy_rate}%</div>
                  <div className="text-[12px] text-slate-400">ADR {formatMoney(o.adr)} · RevPAR {formatMoney(o.revpar)}</div>
                </div>
                <div className={CARD}>
                  <Receipt className="h-8 w-8 rounded-lg bg-[#e8f8f1] p-1.5 text-[#0f9f6e]" />
                  <div className="mt-4 text-[11px] font-semibold uppercase text-slate-400">{t('Montant encaissé')}</div>
                  <div className="text-[26px] font-bold">{formatNumber(o.revenue)}</div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-[#10B981]" style={{ width: `${Math.min(pct(o.revenue, booked), 100)}%` }} /></div>
                </div>
                <div className={CARD}>
                  <div className="flex items-center justify-between">
                    <CalendarDays className="h-8 w-8 rounded-lg bg-red-50 p-1.5 text-red-500" />
                  </div>
                  <div className="mt-4 text-[11px] font-semibold uppercase text-slate-400">{t('Solde impayé')}</div>
                  <div className="text-[26px] font-bold text-red-500">{rec.data ? formatNumber(rec.data.total_due) : '—'}</div>
                  <div className="text-[12px] text-slate-400">{rec.data ? t('{n} dossier(s) en attente', { n: rec.data.count }) : ''}</div>
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className={CARD}>
                  <CalendarDays className="h-8 w-8 rounded-lg bg-[#fff4d6] p-1.5 text-amber-500" />
                  <div className="mt-4 text-[11px] font-semibold uppercase text-slate-400">{t('Nb réservations')}</div>
                  <div className="text-[26px] font-bold">{o.reservations_count} <span className="text-[13px] font-medium text-slate-400">{t('sur la période')}</span></div>
                  <div className="mt-2 flex gap-2 text-[11px]">
                    <span className="rounded bg-[#d8f8ea] px-2 py-0.5 font-semibold text-[#0f9f6e]">{t('{n} nouveau(x) client(s)', { n: o.new_clients })}</span>
                    <span className="rounded bg-red-50 px-2 py-0.5 font-semibold text-red-500">{t('{n}% annulations', { n: o.cancellation_rate })}</span>
                  </div>
                </div>
                <div className={`${CARD} lg:col-span-2`}>
                  <div className="text-[11px] font-semibold uppercase text-slate-400">{t('Source principale de réservations')}</div>
                  <div className="mt-2 text-[22px] font-bold">{sourceEntries[0] ? sourceName(sourceEntries[0][0]) : '—'}</div>
                  <div className="text-[13px] text-slate-400">{sourceEntries[0] ? t('Génère {n}% des réservations de la période', { n: pct(sourceEntries[0][1], sourceTotal) }) : t('Aucune réservation sur la période')}</div>
                  <div className="mt-4 flex gap-3">
                    {sourceEntries.slice(0, 3).map(([k, v]) => (
                      <div key={k} title={sourceName(k)} className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#10B981] text-[12px] font-bold">{pct(v, sourceTotal)}%</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:col-span-8">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="m-0 text-[16px] font-bold">{t('Chiffre d\'Affaires par jour')}</h3>
                    <div className="flex gap-3 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#006C49]" /> {t('Réel')}</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0D1520]" /> {t('Prévisionnel')}</span>
                    </div>
                  </div>
                  <RevenueChart series={o.revenue_series} forecast={o.forecast_series} today={todayStr()} />
                </section>
                <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-4">
                  <h3 className="m-0 mb-5 text-[16px] font-bold">{t('Répartition par source')}</h3>
                  {sourceEntries.length === 0 ? <p className="m-0 text-[13px] text-slate-400">{t('Aucune réservation sur la période')}</p> : (
                    <div className="space-y-5">
                      {(showAllChannels ? sourceEntries : sourceEntries.slice(0, 3)).map(([k, v], i) => {
                        const Icon = CHANNEL_GLYPHS[Math.min(i, CHANNEL_GLYPHS.length - 1)];
                        const [tile, fill] = CHANNEL_STYLES[Math.min(i, CHANNEL_STYLES.length - 1)];
                        return (
                          <div key={k} className="flex items-center gap-3">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tile}`}><Icon className="h-5 w-5" /></span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                                <span className="truncate font-bold">{sourceName(k)}</span>
                                <span className="font-semibold">{pct(v, sourceTotal)}%{showAllChannels ? <span className="ml-1 font-normal text-slate-400">({v})</span> : null}</span>
                              </div>
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct(v, sourceTotal)}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-6 border-t border-slate-100 pt-4 text-center">
                    <button type="button" onClick={() => setShowAllChannels((v) => !v)} className="border-0 bg-transparent text-[12px] font-semibold text-slate-400 hover:text-slate-600">
                      {showAllChannels ? t('Réduire') : t('Détail complet des canaux')}
                    </button>
                  </div>
                </section>
              </div>

              <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="m-0 text-[14px] font-semibold">{t('Modes de Paiement')}</h3>
                  <span className="text-[12px] font-semibold text-slate-400">{t('TOTAL: {n}', { n: formatMoney(modeTotal) })}</span>
                </div>
                {modeEntries.length === 0 ? <p className="m-0 text-[13px] text-slate-400">{t('Aucun encaissement sur la période')}</p> : (
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {modeEntries.map(([k, v], i) => (
                      <PaymentModeCard key={k} l={paymentMethodLabel(k, methods)} v={formatNumber(v)} p={t('{n}% des encaissements', { n: pct(v, modeTotal) })} c={MODE_BORDERS[Math.min(i, MODE_BORDERS.length - 1)]} />
                    ))}
                  </div>
                )}
              </section>

              {can('payments.read') && (
                <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="m-0 text-[14px] font-semibold">{t('Dernières transactions impactantes')}</h3>
                    <Link to="/payments" className="text-[12px] font-semibold text-slate-400 no-underline">{t('Voir tout le journal')}</Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[13px]">
                      <thead>
                        <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
                          <th className={TH}>{t('Client')}</th><th className={TH}>{t('Description')}</th><th className={TH}>{t('Montant')}</th><th className={TH}>{t('Mode')}</th><th className={TH}>{t('Statut')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(recent.data?.items || []).map((tx) => {
                          const client = tx.reservation_id?.client_id;
                          const refund = tx.type === 'refund';
                          const good = tx.payment_status === 'completed';
                          return (
                            <tr key={tx._id} className="border-t border-slate-100">
                              <td className="py-3">
                                <span className={`mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${good ? 'bg-slate-100' : 'bg-red-50 text-red-500'}`}>{client?.first_name ? initials(client) : '—'}</span>
                                {fullName(client) || '—'}
                              </td>
                              <td className="py-3 text-slate-500">{refund ? t('Remboursement') : t('Paiement')} {tx.reservation_id?.reservation_number || ''}</td>
                              <td className={`py-3 font-bold ${refund ? 'text-red-500' : ''}`}>{refund ? '-' : ''}{formatMoney(tx.amount)}</td>
                              <td className="py-3">{paymentMethodLabel(tx.payment_method, methods)}</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${good ? 'bg-[#d8f8ea] text-[#0f9f6e]' : 'bg-[#fde4e4] text-red-500'}`}>{good ? t('Confirmé') : PAYMENT_STATUS_LABELS[tx.payment_status] || tx.payment_status}</span>
                              </td>
                            </tr>
                          );
                        })}
                        {recent.data && recent.data.items.length === 0 && <tr className="border-t border-slate-100"><td colSpan={5} className="py-6 text-center text-slate-400">{t('Aucune transaction sur la période')}</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Breakdown title="Réservations par statut" entries={Object.entries(o.by_status).map(([k, v]) => [RESERVATION_STATUS_LABELS[k] || k, v])} />
                <Breakdown title="Chiffre d'affaires par type de chambre" entries={Object.entries(o.revenue_by_room_type)} fmt={formatMoney} />
                <section className={CARD}>
                  <h3 className="mb-3 mt-0 text-[14px] font-semibold">{t('Meilleurs clients')}</h3>
                  {o.top_clients.length === 0 ? <p className="m-0 text-[13px] text-slate-400">{t('Aucune donnée sur la période')}</p> : (
                    <div className="space-y-3">
                      {o.top_clients.map((c) => (
                        <div key={c.name} className="flex items-center justify-between text-[13px]">
                          <span className="inline-flex items-center gap-2"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold">{c.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>{c.name}</span>
                          <span className="font-semibold">{formatMoney(c.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}

          {tab === 'occupancy' && (
            <>
              <section className={`${CARD} mb-4`}>
                <h3 className="mb-3 mt-0 text-[14px] font-semibold">{t('Taux d\'occupation (%)')}</h3>
                <div className="h-64"><Line data={{ labels: occ.data.rows.map((x) => short(x.date)), datasets: [{ label: '%', data: occ.data.rows.map((x) => x.rate), borderColor: '#0D1520', backgroundColor: 'rgba(16,185,129,.12)', fill: true, tension: 0.3, pointRadius: 2 }] }} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } }} /></div>
              </section>
              <section className={CARD}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-[13px]">
                    <thead><tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400"><th className={TH}>{t('Date')}</th><th className={`${TH} text-right`}>{t('Chambres occupées')}</th><th className={`${TH} text-right`}>{t('Total chambres')}</th><th className={`${TH} text-right`}>{t('Taux')}</th><th className={`${TH} text-right`}>{t('Arrivées')}</th><th className={`${TH} text-right`}>{t('Départs')}</th></tr></thead>
                    <tbody>
                      {occ.data.rows.map((r) => (
                        <tr key={r.date} className="border-t border-slate-100"><td className="py-3">{formatDay(r.date)}</td><td className="py-3 text-right">{r.occupied}</td><td className="py-3 text-right">{r.total}</td><td className="py-3 text-right font-bold">{r.rate} %</td><td className="py-3 text-right">{r.arrivals}</td><td className="py-3 text-right">{r.departures}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {tab === 'receivables' && (
            <>
              <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className={CARD}><div className="text-[11px] font-semibold uppercase text-slate-400">{t('Total à recouvrer')}</div><div className="mt-2 text-[26px] font-bold text-red-500">{formatNumber(rec.data.total_due)}</div><div className="text-[12px] text-slate-400">FCFA</div></div>
                <div className={CARD}><div className="text-[11px] font-semibold uppercase text-slate-400">{t('Dossiers concernés')}</div><div className="mt-2 text-[26px] font-bold">{rec.data.count}</div><div className="text-[12px] text-slate-400">{t('en attente de règlement')}</div></div>
              </div>
              <section className={CARD}>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-[13px]">
                    <thead><tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400"><th className={TH}>{t('Réservation')}</th><th className={TH}>{t('Client')}</th><th className={TH}>{t('Départ')}</th><th className={`${TH} text-right`}>{t('Total')}</th><th className={`${TH} text-right`}>{t('Payé')}</th><th className={`${TH} text-right`}>{t('Reste dû')}</th></tr></thead>
                    <tbody>
                      {rec.data.rows.map((r) => (
                        <tr key={r.reservation_id} className="border-t border-slate-100">
                          <td className="py-3"><Link to={`/reservations/${r.reservation_id}`} className="font-semibold text-slate-800 no-underline hover:underline">{r.reservation_number}</Link></td>
                          <td className="py-3">{r.client_name}<span className="block text-[12px] text-slate-400">{r.client_phone}</span></td>
                          <td className="py-3 text-slate-500">{formatDay(r.departure_date)}</td>
                          <td className="py-3 text-right">{formatMoney(r.total_amount)}</td>
                          <td className="py-3 text-right">{formatMoney(r.paid_amount)}</td>
                          <td className="py-3 text-right font-bold text-red-500">{formatMoney(r.balance_amount)}</td>
                        </tr>
                      ))}
                      {rec.data.rows.length === 0 && <tr className="border-t border-slate-100"><td colSpan={6} className="py-6 text-center text-slate-400">{t('Aucune créance : tous les séjours sont soldés')}</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {tab === 'usage' && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[['Connexions', usage.data.logins], ['Utilisateurs actifs', usage.data.active_users], ['Exports réalisés', usage.data.exports], ['Documents générés', usage.data.documents_generated]].map(([l, v]) => (
                  <div key={l} className={CARD}><div className="text-[11px] font-semibold uppercase text-slate-400">{t(l)}</div><div className="mt-2 text-[26px] font-bold">{v}</div></div>
                ))}
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Breakdown title="Connexions par utilisateur" entries={Object.entries(usage.data.logins_by_user)} />
                <Breakdown title="Documents par type" entries={Object.entries(usage.data.documents_by_type)} />
              </div>
            </>
          )}
        </>
      ))}
    </div>
  );
};

export default ReportsPage;
