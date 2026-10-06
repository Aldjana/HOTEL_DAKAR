import { useState } from 'react';
import { CreditCard, Download } from 'lucide-react';
import { ErrorState, Pagination, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useFetch } from '../../../hooks/useFetch';
import { usePaymentMethods } from '../../../hooks/useReference';
import { paymentsApi } from '../../../services/api/paymentsApi';
import { openPdf } from '../../../services/download';
import { PAYMENT_STATUS_LABELS, paymentMethodLabel } from '../../../constants/status';
import { addDaysStr, formatNumber, todayStr } from '../../../utils/format';
import { useT } from '../../../i18n';
import PaymentActionModal from '../components/PaymentActionModal';
import NewPaymentModal from '../components/NewPaymentModal';
import PaymentMethodCard from '../components/PaymentMethodCard';
import TransactionsTable from '../components/TransactionsTable';
import { useExport } from '../components/useExport';
import { formatShort, methodCardStyle } from '../components/paymentsUi';

const EMPTY = { search: '', payment_method: '', type: '', status: '', from: '', to: '' };
const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));

const PaymentsPage = () => {
  const { can } = useAuth();
  const { t } = useT();
  const toast = useToast();
  const methods = usePaymentMethods();
  const [draft, setDraft] = useState(EMPTY);
  const [f, setF] = useState(EMPTY); // filtres appliqués (bouton « Filtrer »)
  const [page, setPage] = useState(1);
  const [action, setAction] = useState(null); // { mode, payment }
  const [creating, setCreating] = useState(false);
  const params = clean(f);
  const exporter = useExport('payments', params);
  const { data, loading, error, reload } = useFetch(() => paymentsApi.list({ page, limit: 15, include_voided: 'true', ...params }), [page, f]);

  // Cartes : encaissements du jour (ou de la période filtrée)
  const today = todayStr();
  const periodic = !!(f.from || f.to);
  const sumParams = periodic ? clean({ from: f.from, to: f.to, payment_method: f.payment_method }) : { from: today, to: today };
  const { data: summary, reload: reloadSummary } = useFetch(() => paymentsApi.summary(sumParams), [f.from, f.to, f.payment_method]);
  const yesterday = addDaysStr(today, -1);
  const { data: prev, reload: reloadPrev } = useFetch(() => (periodic ? Promise.resolve(null) : paymentsApi.summary({ from: yesterday, to: yesterday })), [periodic]);

  const set = (k) => (e) => setDraft({ ...draft, [k]: e.target.value });
  const apply = (e) => { e?.preventDefault(); setF(draft); setPage(1); };
  const refresh = () => { reload(); reloadSummary(); reloadPrev(); };

  const trend = summary && prev && prev.net_total > 0 ? Math.round(((summary.net_total - prev.net_total) / prev.net_total) * 100) : null;
  const byMethod = Object.entries(summary?.by_method || {});
  const inputCls = 'h-11 rounded-xl border border-slate-200 px-3 text-[13px]';

  return (
    <>
      <p className="mb-5 text-[13px] text-slate-400">{t('Suivez les avances, soldes et encaissements de votre établissement en temps réel.')}</p>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="min-w-[220px] flex-1 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{periodic ? t('Total encaissé (net)') : t("Total encaissé aujourd'hui")}</div>
          <div className="mt-2 text-[28px] font-bold">{summary ? formatNumber(summary.net_total) : '—'} <span className="text-[14px] font-medium text-slate-400">FCFA</span></div>
          {!periodic && (
            <div className={`mt-1 text-[12px] font-semibold ${trend != null && trend < 0 ? 'text-[#dc3b4e]' : 'text-[#0f9f6e]'}`}>
              {trend == null ? <span className="font-normal text-slate-400">{t('Aucun encaissement hier pour comparer')}</span> : <>{trend < 0 ? '↘' : '↗'} {trend > 0 ? '+' : ''}{trend}% <span className="font-normal text-slate-400">{t('vs hier')}</span></>}
            </div>
          )}
        </div>
        {byMethod.map(([code, v]) => (
          <PaymentMethodCard key={code} label={paymentMethodLabel(code, methods)} value={formatShort(v.net)} {...methodCardStyle(code)} />
        ))}
      </div>

      <form onSubmit={apply} className="mb-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{t('Recherche')}</div>
        <div className="flex flex-wrap gap-3">
          <input value={draft.search} onChange={set('search')} placeholder={t('Référence, client, rés')} className={`${inputCls} min-w-[180px] flex-1 outline-none`} />
          <input type="date" value={draft.from} onChange={set('from')} title={t('Du')} className={inputCls} />
          <input type="date" value={draft.to} onChange={set('to')} title={t('Au')} className={inputCls} />
          <select value={draft.payment_method} onChange={set('payment_method')} className={inputCls}><option value="">{t('Tous les modes')}</option>{methods.map((m) => <option key={m.code} value={m.code}>{m.name}</option>)}</select>
          <select value={draft.type} onChange={set('type')} className={inputCls}><option value="">{t('Tous')}</option><option value="payment">{t('Paiements')}</option><option value="refund">{t('Remboursements')}</option></select>
          <select value={draft.status} onChange={set('status')} className={inputCls}><option value="">{t('Tous statuts')}</option>{Object.entries(PAYMENT_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="submit" className="rounded-lg bg-[#0D1520] px-5 py-2 text-[13px] font-semibold text-white">{t('Filtrer')}</button>
          {(f.search || f.from || f.to || f.payment_method || f.type || f.status) && <button type="button" onClick={() => { setDraft(EMPTY); setF(EMPTY); setPage(1); }} className="rounded-lg border border-slate-200 bg-white px-5 py-2 text-[13px] font-semibold text-slate-600">{t('Réinitialiser')}</button>}
        </div>
      </form>

      <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="m-0 text-[14px] font-semibold">{t('Journal des Transactions')}</h3>
          {exporter.allowed && (
            <div className="flex items-center gap-4">
              <button type="button" disabled={!!exporter.busy} onClick={() => exporter.run('xlsx')} className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-semibold text-slate-500 disabled:opacity-50">
                <Download className="h-4 w-4" /> {t('Exporter Excel')}
              </button>
              <button type="button" disabled={!!exporter.busy} onClick={() => exporter.run('pdf')} className="inline-flex items-center gap-2 border-0 bg-transparent p-0 text-[13px] font-semibold text-slate-500 disabled:opacity-50">
                <Download className="h-4 w-4" /> {t('Exporter PDF')}
              </button>
            </div>
          )}
        </div>
        {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
          <>
            <TransactionsTable rows={data.items} methods={methods} can={can} onReceipt={(p) => openPdf(`/payments/${p._id}/receipt`).catch((e) => toast.error(e.message))} onAction={(mode, payment) => setAction({ mode, payment })} />
            <Pagination pagination={data.pagination} onPageChange={setPage} label={t('paiements')} />
          </>
        )}
      </section>

      {can('payments.create') && (
        <button type="button" title={t('Nouveau paiement')} aria-label={t('Nouveau paiement')} onClick={() => setCreating(true)} className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#0D1520] text-white shadow-lg transition-colors hover:bg-[#1a293d]">
          <CreditCard className="h-6 w-6" />
        </button>
      )}

      <PaymentActionModal isOpen={!!action} onClose={() => setAction(null)} payment={action?.payment} mode={action?.mode} onDone={refresh} />
      <NewPaymentModal isOpen={creating} onClose={() => setCreating(false)} onSaved={refresh} />
    </>
  );
};

export default PaymentsPage;
