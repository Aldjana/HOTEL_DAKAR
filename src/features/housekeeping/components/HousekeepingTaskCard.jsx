import { Trash2 } from 'lucide-react';
import { useT, tr } from '../../../i18n';
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS } from '../../../constants/status';
import { formatDay, fullName } from '../../../utils/format';

const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Heure de départ : « 11:20 » si c'est aujourd'hui, « Hier », sinon la date.
const departureLabel = (value) => {
  if (!value) return '';
  const d = new Date(value);
  const now = new Date();
  if (sameDay(d, now)) return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return tr('Hier');
  return formatDay(value);
};

const HousekeepingTaskCard = ({ task, staff = [], canManage, canWrite, onStart, onComplete, onAssign, onRemove }) => {
  const { t } = useT();
  const high = task.priority === 'high' || task.priority === 'urgent';
  const done = task.status === 'completed';
  const maintenance = task.task_type === 'maintenance';
  const departure = departureLabel(task.departure_time);
  const badge = task.status !== 'pending' ? TASK_STATUS_LABELS[task.status] : '';
  const typeLine = [task.room_id?.room_type_id?.name, TASK_TYPE_LABELS[task.task_type]].filter(Boolean).join(' · ');
  const assignedId = task.assigned_to?._id || task.assigned_to || '';

  return (
    <article className={`rounded-2xl border bg-white p-4 shadow-sm ${high && !done ? 'border-red-300' : 'border-slate-100'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[16px] font-bold">{t('Ch. {n}', { n: task.room_id?.room_number || '—' })}</div>
          <div className="text-[12px] text-slate-400">{typeLine || '—'}</div>
        </div>
        <div className="text-right">
          {high && !done && <div className="rounded bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{task.priority === 'urgent' ? t('Priorité urgente') : t('Priorité haute')}</div>}
          {badge && <div className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{badge}</div>}
          {departure
            ? <div className="mt-1 text-[12px] font-semibold text-red-500">{t('Départ {d}', { d: departure })}</div>
            : task.scheduled_date && <div className="mt-1 text-[12px] font-semibold text-slate-400">{t('Prévue {d}', { d: formatDay(task.scheduled_date) })}</div>}
        </div>
      </div>
      <div className="mt-3 text-[12px] text-slate-500">{t('Dernier client:')} <span className="font-semibold text-slate-700">{task.guest_name || '—'}</span></div>
      {task.notes && !maintenance && (
        <div className={`mt-3 rounded-xl px-3 py-2 text-[12px] ${high && !done ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}`}>
          {t('Note:')} {task.notes}
        </div>
      )}
      {maintenance && task.notes && (
        <div className="mt-3 text-[12px] font-semibold text-red-500">{t('Problème:')} {task.notes}</div>
      )}
      {canManage && !done ? (
        <select
          value={assignedId}
          onChange={(e) => onAssign(task, e.target.value)}
          className="mt-3 h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-500"
        >
          <option value="">{t('Non assignée')}</option>
          {staff.map((u) => <option key={u._id} value={u._id}>{fullName(u)}</option>)}
        </select>
      ) : (
        <div className="mt-3 text-[12px] text-slate-500">{t('Assignée à :')} <span className="font-semibold text-slate-700">{fullName(task.assigned_to) || t('personne')}</span></div>
      )}
      <div className="mt-4 flex gap-2">
        {done ? (
          <button type="button" disabled className="flex-1 rounded-lg bg-slate-400 py-2 text-[13px] font-semibold text-white">{t('Terminée')}</button>
        ) : (
          <>
            {canWrite && task.status === 'pending' && (
              <button type="button" onClick={() => onStart(task)} className="flex-1 rounded-lg border border-slate-200 py-2 text-[13px] font-semibold text-slate-600">{t('Démarrer')}</button>
            )}
            {canWrite && (
              <button type="button" onClick={() => onComplete(task)} className="flex-1 rounded-lg bg-[#0f9f6e] py-2 text-[13px] font-semibold text-white">{maintenance ? t('Terminer') : t('Marquer propre')}</button>
            )}
          </>
        )}
        {canManage && (
          <button type="button" onClick={() => onRemove(task)} aria-label={t('Supprimer')} title={t('Supprimer')} className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-400"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
    </article>
  );
};

export default HousekeepingTaskCard;
