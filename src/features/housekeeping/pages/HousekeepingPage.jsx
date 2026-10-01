import { useState } from 'react';
import { useT } from '../../../i18n';
import { Plus } from 'lucide-react';
import { ErrorState, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { housekeepingApi } from '../../../services/api/housekeepingApi';
import { getErrorMessage } from '../../../services/api/client';
import HousekeepingStatsCard from '../components/HousekeepingStatsCard';
import HousekeepingTabs from '../components/HousekeepingTabs';
import HousekeepingTaskCard from '../components/HousekeepingTaskCard';
import TaskFormModal from '../components/TaskFormModal';

const pad = (n) => (n == null ? '—' : String(n).padStart(2, '0'));
const OPEN = ['pending', 'in_progress'];

const HousekeepingPage = () => {
  const { t } = useT();
  const { can, user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState('pending');
  const [mine, setMine] = useState(user?.role === 'housekeeping');
  const [creating, setCreating] = useState(false);
  const assigned_to = mine ? user._id : undefined;
  const isMaint = tab === 'maintenance';

  const list = useFetch(() => housekeepingApi.list({ status: tab, limit: 100, assigned_to }), [tab, mine], { enabled: !isMaint });
  const maint = useFetch(() => housekeepingApi.list({ task_type: 'maintenance', limit: 100, assigned_to }), [mine]);
  const { data: stats, reload: reloadStats } = useFetch(() => housekeepingApi.statistics(), []);
  const { data: staff } = useFetch(() => housekeepingApi.staff(), []);
  const manage = can('rooms.manage');
  const write = can('housekeeping.write');
  const refresh = () => { list.reload(); maint.reload(); reloadStats(); };

  const maintItems = (maint.data?.items || []).filter((x) => OPEN.includes(x.status));
  const cur = isMaint ? maint : list;
  const items = isMaint ? maintItems : (list.data?.items || []);

  const tabs = [
    { id: 'pending', label: t('À nettoyer'), count: stats?.pending ?? '—', icon: 'User' },
    { id: 'in_progress', label: t('En cours'), count: stats?.inProgress ?? '—', icon: 'Clock' },
    { id: 'completed', label: t('Terminées'), count: stats?.completed ?? '—', icon: 'BadgeCheck' },
    { id: 'maintenance', label: t('Maintenance'), count: maint.data ? maintItems.length : '—', icon: 'TriangleAlert' },
  ];
  const maintRooms = stats?.rooms.maintenance;

  const act = async (fn, ok) => { try { await fn(); toast.success(ok); refresh(); } catch (e) { toast.error(getErrorMessage(e)); } };
  const onStart = (tk) => act(() => housekeepingApi.start(tk._id), t('Nettoyage démarré'));
  const onComplete = (tk) => act(() => housekeepingApi.complete(tk._id), t('Chambre {n} prête', { n: tk.room_id?.room_number ?? '' }));
  const onAssign = (tk, id) => act(() => (id ? housekeepingApi.assign(tk._id, id) : housekeepingApi.update(tk._id, { assigned_to: '' })), t('Assignation mise à jour'));
  const onRemove = async (tk) => { if (await confirm({ title: t('Supprimer cette tâche ?'), confirmLabel: t('Supprimer'), danger: true })) act(() => housekeepingApi.remove(tk._id), t('Tâche supprimée')); };

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HousekeepingStatsCard label={t('Total à faire')} value={pad(stats ? stats.pending + stats.inProgress : null)} unit={t('Tâches')} color="text-slate-900" />
        <HousekeepingStatsCard label={t('En cours')} value={pad(stats?.inProgress)} unit={t('Tâches')} color="text-slate-900" />
        <HousekeepingStatsCard label={t('Prêtes')} value={pad(stats?.rooms.ready)} unit={t('Chambres')} color="text-[#0f9f6e]" borderClass="border-l-[#10B981]" />
        <HousekeepingStatsCard label={t('Maintenance')} value={pad(maintRooms)} unit={maintRooms > 0 ? t('Urgent') : t('Chambres')} color="text-red-500" borderClass="border-l-red-500" />
      </div>

      <div className="flex flex-wrap items-start justify-between gap-2">
        <HousekeepingTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />
        <label className="mb-4 flex items-center gap-2 text-[13px] text-slate-400">
          <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="h-4 w-4 accent-[#10B981]" /> {t('Mes tâches uniquement')}
        </label>
      </div>

      {cur.loading && !cur.data ? <Spinner /> : cur.error ? <ErrorState message={cur.error} onRetry={cur.reload} /> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((task) => (
            <HousekeepingTaskCard key={task._id} task={task} staff={staff || []} canManage={manage} canWrite={write} onStart={onStart} onComplete={onComplete} onAssign={onAssign} onRemove={onRemove} />
          ))}
          {write && (
            <button type="button" onClick={() => setCreating(true)} className="flex min-h-[180px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">
              <Plus className="mb-2 h-6 w-6" />
              <div className="font-semibold text-slate-600">{t('Ajouter une tâche')}</div>
              <div className="text-[12px]">{t('Inspecter une zone commune')}</div>
            </button>
          )}
          {items.length === 0 && !write && <div className="col-span-full py-10 text-center text-[13px] text-slate-400">{t('Aucune tâche')}</div>}
        </div>
      )}
      <TaskFormModal isOpen={creating} onClose={() => setCreating(false)} staff={staff || []} canAssign={manage} onSaved={refresh} />
    </div>
  );
};

export default HousekeepingPage;
