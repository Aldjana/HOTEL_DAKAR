import Pagination from '../../../components/ui/Pagination';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarX, Check, Clock } from 'lucide-react';
import { ErrorState, Spinner } from '../../../components/ui';
import { EmptyState } from '../../../components/common';
import ReservationsTable from '../components/ReservationsTable';
import ReservationFilters from '../components/ReservationFilters';
import ReservationStatsCard from '../components/ReservationStatsCard';
import { useAuth } from '../../../context/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { useDebounce } from '../../../hooks/useDebounce';
import { useReservationSources } from '../../../hooks/useReference';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { dashboardApi } from '../../../services/api/dashboardApi';
import { useT } from '../../../i18n';

const pad2 = (n) => String(n).padStart(2, '0');

const ReservationsListPage = () => {
  const { t } = useT();
  const navigate = useNavigate();
  const { can } = useAuth();
  const sources = useReservationSources();
  const [filters, setFilters] = useState({ search: '', status: '', payment_status: '', source: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const q = useDebounce(filters.search, 300);
  const clean = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== ''));
  const params = clean({ ...filters, search: q });
  const { data, loading, error, reload } = useFetch(
    () => reservationsApi.list({ page, limit: 15, ...params }),
    [page, q, filters.status, filters.payment_status, filters.source, filters.from, filters.to],
  );
  const { data: day } = useFetch(() => dashboardApi.statistics().catch(() => null), [], { enabled: can('dashboard.read') });
  const isFiltered = Object.values(filters).some(Boolean);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const arrivals = day?.arrivals;
  const departures = day?.departures;
  const pagination = data?.pagination;

  return (
    <div>
      <p className="mb-4 mt-1 text-[13px] text-slate-400">{t('Gérez les réservations, arrivées, départs et paiements')}</p>

      <ReservationFilters filters={filters} sources={sources} onFilterChange={handleFilterChange} exportParams={params} />

      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.items.length === 0 && !isFiltered ? (
        <EmptyState
          icon={<CalendarX className="h-10 w-10" />}
          title={t('Aucune réservation')}
          message={t('Les réservations créées apparaîtront ici.')}
        />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          <ReservationsTable reservations={data.items} onViewDetails={(id) => navigate(`/reservations/${id}`)} />
          {data.items.length === 0 && (
            <div className="px-5 py-8 text-center text-[13px] text-slate-400">{t('Aucune réservation ne correspond aux filtres')}</div>
          )}
          <Pagination pagination={pagination} onPageChange={setPage} label={t('réservations')} />
        </section>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <ReservationStatsCard
          icon={Check}
          iconBg="bg-[#c6f6d5]"
          iconColor="text-[#0f9f6e]"
          change={arrivals ? t('{n} attendues', { n: arrivals.filter((r) => r.status !== 'checked_in').length }) : '—'}
          changeColor="text-[#0f9f6e]"
          label={t('Arrivées du jour')}
          value={arrivals ? pad2(arrivals.length) : '—'}
        />
        <ReservationStatsCard
          icon={Clock}
          iconBg="bg-[#fde7c7]"
          iconColor="text-[#d97706]"
          change={day ? t('{n} attendus', { n: day.departures_count }) : '—'}
          changeColor="text-[#d97706]"
          label={t('Départs du jour')}
          value={departures ? pad2(departures.length) : '—'}
        />
      </div>
    </div>
  );
};

export default ReservationsListPage;
