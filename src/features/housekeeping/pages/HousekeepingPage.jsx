import { useState } from 'react';
import { useT } from '../../../i18n';
import { ClipboardList } from 'lucide-react';
import { Button, ErrorState, Input, Modal, Spinner } from '../../../components/ui';
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

// ⚠ sur une carte : signale un problème → tâche de maintenance (onglet Maintenance).
const ReportProblemModal = ({ task, onClose, onSaved }) => {
  const { t } = useT();
  const toast = useToast();
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!notes.trim()) return;
    setSaving(true);
    try {
      await housekeepingApi.create({ room_id: task.room_id?._id || task.room_id, task_type: 'maintenance', priority: 'high', notes: notes.trim() });
      toast.success(t('Problème signalé'));
      onSaved(); onClose();
    } catch (err) { toast.error(getErrorMessage(err)); } finally { setSaving(false); }
  };
  return (
    <Modal isOpen={!!task} onClose={onClose} size="sm" title={t('Signaler un problème — Ch. {n}', { n: task?.room_id?.room_number || '' })}>
      <form onSubmit={submit}>
        <Input label={t('Description du problème')} multiline required value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={t('Ex : fuite d\'eau dans la salle de bain')} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" variant="danger" loading={saving}>{t('Signaler')}</Button></div>
      </form>
    </Modal>
  );
};

const HousekeepingPage = () => {
  const { t } = useT();
  const { can } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [tab, setTab] = useState('pending');
  const [creating, setCreating] = useState(false);
  const [reporting, setReporting] = useState(null);
  const isMaint = tab === 'maintenance';

  const list = useFetch(() => housekeepingApi.list({ status: tab, limit: 100 }), [tab], { enabled: !isMaint });
  const maint = useFetch(() => housekeepingApi.list({ task_type: 'maintenance', limit: 100 }), []);
  const { data: stats, reload: reloadStats } = useFetch(() => housekeepingApi.statistics(), []);
  const manage = can('rooms.manage');
  const write = can('housekeeping.write');
  const refresh = () => { list.reload(); maint.reload(); reloadStats(); };

  const maintItems = (maint.data?.items || []).filter((x) => OPEN.includes(x.status));
  const cur = isMaint ? maint : list;
  // Les tâches de maintenance ont leur propre onglet
  const items = isMaint ? maintItems : (list.data?.items || []).filter((x) => x.task_type !== 'maintenance');

  const tabs = [
    { id: 'pending', label: t('À nettoyer'), count: stats?.pending ?? '—', icon: 'Broom' },
    { id: 'in_progress', label: t('En cours'), count: stats?.inProgress ?? '—', icon: 'CircleEllipsis' },
    { id: 'completed', label: t('Prêtes'), count: stats?.rooms.ready ?? '—', icon: 'CircleCheck' },
    { id: 'maintenance', label: t('Maintenance'), count: maint.data ? maintItems.length : '—', icon: 'Wrench' },
  ];

  const act = async (fn, ok) => { try { await fn(); toast.success(ok); refresh(); } catch (e) { toast.error(getErrorMessage(e)); } };
  const onComplete = (tk) => act(() => housekeepingApi.complete(tk._id), tk.task_type === 'maintenance' ? t('Chambre {n} remise en service', { n: tk.room_id?.room_number ?? '' }) : t('Chambre {n} prête', { n: tk.room_id?.room_number ?? '' }));
  const onRemove = async (tk) => { if (await confirm({ title: t('Supprimer cette tâche ?'), confirmLabel: t('Supprimer'), danger: true })) act(() => housekeepingApi.remove(tk._id), t('Tâche supprimée')); };

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <HousekeepingStatsCard label={t('Total à faire')} value={pad(stats?.pending)} unit={t('Chambres')} color="text-slate-900" onClick={() => setTab('pending')} />
        <HousekeepingStatsCard label={t('En cours')} value={pad(stats?.inProgress)} unit={t('Chambres')} color="text-slate-900" onClick={() => setTab('in_progress')} />
        <HousekeepingStatsCard label={t('Prêtes')} value={pad(stats?.rooms.ready)} unit={t('Chambres')} color="text-[#0f9f6e]" borderClass="border-l-[#10B981]" onClick={() => setTab('completed')} />
        <HousekeepingStatsCard label={t('Maintenance')} value={pad(maint.data ? maintItems.length : null)} unit={t('Urgent')} color="text-red-500" borderClass="border-l-red-500" onClick={() => setTab('maintenance')} />
      </div>

      <HousekeepingTabs tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {cur.loading && !cur.data ? <Spinner /> : cur.error ? <ErrorState message={cur.error} onRetry={cur.reload} /> : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((task) => (
            <HousekeepingTaskCard key={task._id} task={task} canManage={manage} canWrite={write} onComplete={onComplete} onReport={setReporting} onRemove={onRemove} />
          ))}
          {write && (
            <button type="button" onClick={() => setCreating(true)} className="flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-400 hover:bg-slate-50">
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white"><ClipboardList className="h-5 w-5" /></span>
              <div className="text-[13px] font-semibold text-slate-700">{t('Ajouter une tâche')}</div>
              <div className="text-[12px]">{t('Inspecter une zone commune')}</div>
            </button>
          )}
          {items.length === 0 && !write && <div className="col-span-full py-10 text-center text-[13px] text-slate-400">{t('Aucune tâche')}</div>}
        </div>
      )}
      <TaskFormModal isOpen={creating} onClose={() => setCreating(false)} canAssign={false} onSaved={refresh} />
      <ReportProblemModal task={reporting} onClose={() => setReporting(null)} onSaved={refresh} />
    </div>
  );
};

export default HousekeepingPage;
