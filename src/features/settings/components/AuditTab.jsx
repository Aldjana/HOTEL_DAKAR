import { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { ErrorState, Pagination, Spinner } from '../../../components/ui';
import { useFetch } from '../../../hooks/useFetch';
import { reportsApi } from '../../../services/api/reportsApi';
import { AUDIT_ACTION_LABELS } from '../../../constants/status';
import { formatDateTimeLocal } from '../../../utils/format';
import { tr, useT } from '../../../i18n';

const SELECT = 'h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-600';
const TH = 'py-2 font-semibold';

const AuditTab = () => {
  const { t } = useT();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const { data, loading, error, reload } = useFetch(() => reportsApi.auditLogs({ page, limit: 20, action: action || undefined, entity_type: entity || undefined }), [page, action, entity]);
  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="m-0 flex items-center gap-2 text-[15px] font-semibold"><ScrollText className="h-4 w-4" /> {t('Journal d\'audit')}</h3>
        <div className="flex gap-2">
          <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className={SELECT}><option value="">{t('Toutes actions')}</option>{Object.entries(AUDIT_ACTION_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className={SELECT}><option value="">{t('Toutes entités')}</option>{['reservation', 'client', 'room', 'payment', 'invoice', 'user', 'settings', 'cash', 'export'].map((k) => <option key={k} value={k}>{k}</option>)}</select>
        </div>
      </div>
      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-[13px]">
              <thead><tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400"><th className={TH}>{t('Date')}</th><th className={TH}>{t('Utilisateur')}</th><th className={TH}>{t('Action')}</th><th className={TH}>{t('Objet')}</th><th className={TH}>{t('Détail')}</th></tr></thead>
              <tbody>
                {data.items.map((l) => (
                  <tr key={l._id} className="border-t border-slate-100">
                    <td className="py-3 text-slate-500">{formatDateTimeLocal(l.createdAt)}</td>
                    <td className="py-3">{l.user_name || '—'}</td>
                    <td className="py-3 font-semibold">{AUDIT_ACTION_LABELS[l.action] || l.action}</td>
                    <td className="py-3">{l.entity_type}</td>
                    <td className="py-3 text-slate-500">{tr(l.description)}</td>
                  </tr>
                ))}
                {data.items.length === 0 && <tr className="border-t border-slate-100"><td colSpan={5} className="py-6 text-center text-slate-400">{t('Aucune entrée')}</td></tr>}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPageChange={setPage} label={t('entrées')} />
        </>
      )}
    </section>
  );
};

export default AuditTab;
