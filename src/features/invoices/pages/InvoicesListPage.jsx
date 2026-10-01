import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, FileText, Plus, Printer } from 'lucide-react';
import Button from '../../../components/ui/Button/Button';
import Card from '../../../components/ui/Card/Card';
import { ErrorState, Pagination, Spinner } from '../../../components/ui';
import EmptyState from '../../../components/common/EmptyState/EmptyState';
import { StatusBadge } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useFetch } from '../../../hooks/useFetch';
import { useDebounce } from '../../../hooks/useDebounce';
import { invoicesApi } from '../../../services/api/invoicesApi';
import { downloadFile, openPdf } from '../../../services/download';
import { INVOICE_STATUS_LABELS } from '../../../constants/status';
import { formatDay, formatMoney, fullName } from '../../../utils/format';
import NewInvoiceModal from '../components/NewInvoiceModal';
import { useT } from '../../../i18n';

const fieldCls = 'h-9 rounded-lg border border-slate-200 bg-white px-3 text-[12px] outline-none';

const InvoicesListPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { t } = useT();
  const { can } = useAuth();
  const [f, setF] = useState({ search: '', status: '', type: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const q = useDebounce(f.search, 300);
  const params = Object.fromEntries(Object.entries({ ...f, search: q }).filter(([, v]) => v !== ''));
  const { data, loading, error, reload } = useFetch(() => invoicesApi.list({ page, limit: 15, ...params }), [page, q, f.status, f.type, f.from, f.to]);
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const fail = (e) => toast.error(e.message || t('Erreur'));
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const empty = data && data.items.length === 0 && !Object.keys(params).length;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-tight text-slate-900">{t('Factures')}</h2>
          <p className="mt-1 text-[13px] text-slate-400">{t('Générez et gérez les factures de votre établissement.')}</p>
        </div>
        {can('invoices.write') && (
          <Button className="inline-flex items-center gap-2" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            {t('Nouvelle facture')}
          </Button>
        )}
      </div>

      {!empty && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input value={f.search} onChange={set('search')} placeholder={t('N° de facture, client, réservation…')} className={`${fieldCls} min-w-[240px] flex-1`} />
          <select value={f.status} onChange={set('status')} className={fieldCls}><option value="">{t('Tous les statuts')}</option>{Object.entries(INVOICE_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
          <select value={f.type} onChange={set('type')} className={fieldCls}><option value="">{t('Factures + proformas')}</option><option value="invoice">{t('Factures')}</option><option value="proforma">{t('Proformas')}</option></select>
          <input type="date" value={f.from} onChange={set('from')} title={t('Du')} className={fieldCls} />
          <input type="date" value={f.to} onChange={set('to')} title={t('Au')} className={fieldCls} />
        </div>
      )}

      <Card>
        {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : empty ? (
          <EmptyState icon={<FileText className="w-16 h-16 text-gray-400" />} title={t('Aucune facture')} message={t("Une facture est créée automatiquement au check-out, ou depuis la fiche d'une réservation.")} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
                    <th className="py-2 font-semibold">{t('N°')}</th>
                    <th className="py-2 font-semibold">{t('Client')}</th>
                    <th className="py-2 font-semibold">{t('Réservation')}</th>
                    <th className="py-2 font-semibold">{t('Date')}</th>
                    <th className="py-2 font-semibold">{t('Statut')}</th>
                    <th className="py-2 font-semibold">{t('Total')}</th>
                    <th className="py-2 font-semibold">{t('Reste dû')}</th>
                    <th className="py-2 font-semibold">{t('Action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.length === 0 && <tr className="border-t border-slate-100"><td colSpan={8} className="py-8 text-center text-slate-400">{t('Aucune facture ne correspond aux filtres')}</td></tr>}
                  {data.items.map((i) => (
                    <tr key={i._id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => navigate(`/invoices/${i._id}`)}>
                      <td className="py-3 font-semibold">{i.invoice_number}{i.type === 'proforma' && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t('Proforma')}</span>}</td>
                      <td className="py-3">{fullName(i.client) || '—'}</td>
                      <td className="py-3 text-slate-400">{i.reservation?.reservation_number || '—'}</td>
                      <td className="py-3">{formatDay(i.issue_date)}</td>
                      <td className="py-3"><StatusBadge status={i.status} type="invoice" size="sm" /></td>
                      <td className="py-3 font-bold">{formatMoney(i.total_amount)}</td>
                      <td className={`py-3 ${i.balance_amount > 0 && i.status !== 'cancelled' ? 'font-semibold text-[#dc3b4e]' : 'text-slate-400'}`}>{i.status === 'cancelled' ? '—' : formatMoney(i.balance_amount)}</td>
                      <td className="py-3">
                        <div className="flex gap-3 text-slate-400">
                          <button type="button" title={t('Voir / imprimer le PDF')} className="border-0 bg-transparent p-0 text-slate-400 hover:text-slate-800" onClick={stop(() => openPdf(`/invoices/${i._id}/pdf`).catch(fail))}><Printer className="h-4 w-4" /></button>
                          <button type="button" title={t('Télécharger le PDF')} className="border-0 bg-transparent p-0 text-slate-400 hover:text-slate-800" onClick={stop(() => downloadFile(`/invoices/${i._id}/pdf`, undefined, `${i.invoice_number}.pdf`).catch((e) => toast.error(e.response?.data?.message || t('Téléchargement impossible'))))}><Download className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={data.pagination} onPageChange={setPage} label={t('factures')} />
          </>
        )}
      </Card>

      <NewInvoiceModal isOpen={creating} onClose={() => setCreating(false)} onCreated={(inv) => inv?._id && navigate(`/invoices/${inv._id}`)} />
    </>
  );
};

export default InvoicesListPage;
