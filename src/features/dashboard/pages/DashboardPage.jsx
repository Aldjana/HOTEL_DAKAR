import { ErrorState, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { useT } from '../../../i18n';
import { dashboardApi } from '../../../services/api/dashboardApi';
import AlertsPanel from '../components/AlertsPanel';
import ArrivalsTable from '../components/ArrivalsTable';
import DeparturesTable from '../components/DeparturesTable';
import MetricsGrid from '../components/MetricsGrid';
import QuickActionsCard from '../components/QuickActionsCard';

const DashboardPage = () => {
  const { t } = useT();
  const { can } = useAuth();
  const { data: d, loading, error, reload } = useFetch(() => dashboardApi.statistics(), []);

  if (loading && !d) return <Spinner />;
  if (error && !d) return <ErrorState message={error} onRetry={reload} />;
  if (!d) return null;

  const canWrite = can('reservations.write');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-12">
        <div>
          <h2 className="m-0 text-[28px] font-bold tracking-tight text-slate-900">
            {t('Vue d\'ensemble de l\'activité de l\'établissement aujourd\'hui')}
          </h2>
          <p className="mt-1 text-[13px] text-slate-400">{t('Données mises à jour en temps réel.')}</p>
        </div>
        <MetricsGrid data={d} showMoney={d.revenue_today !== undefined && can('payments.read')} />
      </div>

      <div className="space-y-6 lg:col-span-8">
        <ArrivalsTable arrivals={d.arrivals} canWrite={canWrite} />
        <DeparturesTable departures={d.departures} canWrite={canWrite} />
      </div>

      <div className="space-y-6 lg:col-span-4">
        <QuickActionsCard arrivals={d.arrivals} departures={d.departures} />
        <AlertsPanel alerts={d.alerts} />
      </div>
    </div>
  );
};

export default DashboardPage;
