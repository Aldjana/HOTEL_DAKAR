import { useState } from 'react';
import { useT } from '../../../i18n';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Filter, Plus, Search, UserPlus, Users } from 'lucide-react';
import { Button, ErrorState, Spinner } from '../../../components/ui';
import { EmptyState, ExportButtons } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { useDebounce } from '../../../hooks/useDebounce';
import { clientsApi } from '../../../services/api/clientsApi';
import { ROUTES } from '../../../constants/routes';
import { CLIENT_TYPES } from '../../../constants/status';
import { formatMoney } from '../../../utils/format';
import ClientFormModal from '../components/ClientFormModal';
import ClientStatsCard from '../components/ClientStatsCard';
import ClientsTable from '../components/ClientsTable';

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const box = 'h-11 rounded-xl border border-slate-200 bg-white px-3 text-[13px]';

const ClientsListPage = () => {
  const { t } = useT();
  const navigate = useNavigate();
  const { can } = useAuth();
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const [type, setType] = useState('');
  const [vip, setVip] = useState('');
  const [recurring, setRecurring] = useState('');
  const [more, setMore] = useState(false);
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const q = useDebounce(search, 300);
  const { data, loading, error, reload } = useFetch(() => clientsApi.list({ page, limit: 10, search: q || undefined, client_type: type || undefined, is_vip: vip || undefined, recurring: recurring || undefined }), [page, q, type, vip, recurring]);
  const { data: all } = useFetch(() => clientsApi.list({ limit: 500 }), []);

  const setSearch = (value) => {
    const n = new URLSearchParams(params);
    if (value) n.set('q', value); else n.delete('q');
    setParams(n, { replace: true });
    setPage(1);
  };
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  const list = all?.items || [];
  const totalClients = all?.pagination?.total ?? list.length;
  const loyal = list.filter((c) => c.is_recurring).length;
  const spent = list.reduce((s, c) => s + (c.total_spent || 0), 0);
  const now = new Date();
  const newThisMonth = list.filter((c) => { const d = new Date(c.createdAt); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); }).length;
  const stats = all ? [
    { label: t('Total clients'), value: totalClients.toLocaleString('en-US'), meta: t('{n} client(s) VIP', { n: list.filter((c) => c.is_vip).length }), metaClass: 'text-[#0f9f6e]' },
    { label: t('Clients fidèles'), value: loyal, meta: t('{n}% de la base totale', { n: totalClients ? Math.round((loyal / totalClients) * 100) : 0 }), metaClass: 'text-slate-400' },
    { label: t('CA moyen / client'), value: formatMoney(totalClients ? spent / totalClients : 0), meta: t('Total réglé : {m}', { m: formatMoney(spent) }), metaClass: 'text-[#0f9f6e]' },
    { label: t('Nouveaux ce mois'), value: newThisMonth, meta: t('Depuis le 1er {m}', { m: t(MONTHS[now.getMonth()]) }), metaClass: 'text-slate-400' },
  ] : [];

  const filtered = !!(q || type || vip || recurring);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[28px] font-bold">{t('Clients')}</h2>
          <p className="mt-1 text-[13px] text-slate-400">{t("Consultez l'historique des séjours et les informations clients")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons type="clients" params={{ search: q, client_type: type, is_vip: vip, recurring }} />
          {can('reservations.write') && (
            <Link to={ROUTES.NEW_RESERVATION} className="inline-flex items-center gap-2 rounded-lg bg-[#0D1520] px-4 py-2.5 text-[13px] font-semibold text-white no-underline">
              <Plus className="h-4 w-4" /> {t('Nouvelle réservation')}
            </Link>
          )}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => <ClientStatsCard key={stat.label} {...stat} />)}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Rechercher par nom, email ou téléphone...')} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] outline-none" />
        </div>
        <select value={type} onChange={reset(setType)} className={box}>
          <option value="">{t('Type de client')}</option>
          {CLIENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <button type="button" onClick={() => setMore((v) => !v)} className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-semibold">
          <Filter className="h-4 w-4" /> {t('Plus de filtres')}
        </button>
        {(more || vip || recurring) && (
          <>
            <select value={vip} onChange={reset(setVip)} className={box}><option value="">{t('VIP et autres')}</option><option value="true">{t('VIP uniquement')}</option></select>
            <select value={recurring} onChange={reset(setRecurring)} className={box}><option value="">{t('Tous')}</option><option value="true">{t('Clients fidèles (≥ 2 séjours)')}</option></select>
          </>
        )}
        {can('clients.write') && (
          <button type="button" onClick={() => setCreating(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0f9f6e] px-4 text-[13px] font-semibold text-white">
            <UserPlus className="h-4 w-4" /> {t('Ajouter client')}
          </button>
        )}
      </div>

      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.items.length === 0 && !filtered ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title={t('Aucun client')} message={t('Créez votre premier client pour pouvoir enregistrer des réservations.')} action={can('clients.write') && <Button onClick={() => setCreating(true)}>{t('Nouveau client')}</Button>} />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<Users className="h-10 w-10" />} title={t('Aucun résultat')} message={t('Aucun client ne correspond à ces filtres.')} />
      ) : (
        <ClientsTable clients={data.items} pagination={data.pagination} onPageChange={setPage} onOpen={(c) => navigate(`/clients/${c._id}`)} />
      )}
      <ClientFormModal isOpen={creating} onClose={() => setCreating(false)} onSaved={(c) => { reload(); navigate(`/clients/${c._id}`); }} />
    </div>
  );
};

export default ClientsListPage;
