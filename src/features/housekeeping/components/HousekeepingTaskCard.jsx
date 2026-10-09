import { CalendarCheck, CircleAlert, CircleCheck, Lock, StickyNote, Trash2, TriangleAlert, User, Wrench } from 'lucide-react';
import { useT, tr } from '../../../i18n';
import { TASK_STATUS_LABELS } from '../../../constants/status';
import { formatDay } from '../../../utils/format';

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

// Carte d'une tâche de ménage (maquette) : chambre, départ, dernier client, note, « Marquer propre » + signalement.
const HousekeepingTaskCard = ({ task, canManage, canWrite, onComplete, onReport, onRemove }) => {
  const { t } = useT();
  const high = task.priority === 'high' || task.priority === 'urgent';
  const done = task.status === 'completed';
  const maintenance = task.task_type === 'maintenance';
  const urgent = high && !done && !maintenance;
  const departure = departureLabel(task.departure_time);
  const NoteIcon = urgent ? CircleAlert : task.departure_time ? StickyNote : CalendarCheck;

  return (
    <article className={`relative overflow-hidden rounded-xl border bg-white p-4 shadow-sm ${urgent ? 'border-red-600' : 'border-slate-200'}`}>
      {urgent && <div className="absolute right-0 top-0 rounded-bl-md bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase text-white">{task.priority === 'urgent' ? t('Priorité urgente') : t('Priorité haute')}</div>}

      <div className={`flex items-start justify-between gap-3 ${urgent ? 'pt-3' : ''}`}>
        <div className="min-w-0">
          <div className={`text-[15px] font-bold ${maintenance ? 'text-slate-500' : 'text-slate-900'}`}>{t('Ch. {n}', { n: task.room_id?.room_number || '—' })}</div>
          <div className="truncate text-[13px] text-slate-500">{task.room_id?.room_type_id?.name || '—'}</div>
        </div>
        <div className="shrink-0 text-right">
          {maintenance || done ? (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-500">{done ? TASK_STATUS_LABELS.completed : t('En attente')}</span>
          ) : departure ? (
            <>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('Départ')}</div>
              <div className="text-[14px] font-bold text-slate-900">{departure}</div>
            </>
          ) : task.scheduled_date ? (
            <>
              <div className="text-[11px] uppercase tracking-wide text-slate-500">{t('Prévue')}</div>
              <div className="text-[13px] font-bold text-slate-900">{formatDay(task.scheduled_date)}</div>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 text-[13px] text-slate-500">
        <User className="h-3.5 w-3.5" /> {t('Dernier client:')} <span className="font-semibold text-slate-700">{task.guest_name || '—'}</span>
      </div>

      {maintenance ? (
        <div className="mt-3 flex gap-2 rounded-lg border border-red-100 bg-red-50/60 px-3 py-2 text-[13px] text-red-600">
          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{t('Problème:')} {task.notes || t('Maintenance')}</span>
        </div>
      ) : task.notes && (
        <div className={`mt-3 flex gap-2 rounded-lg px-3 py-2 text-[13px] ${urgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
          <NoteIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" /> <span>{t('Note:')} {task.notes}</span>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        {done ? (
          <button type="button" disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-300 py-2 text-[12px] font-semibold text-white"><CircleCheck className="h-4 w-4" /> {t('Prête')}</button>
        ) : maintenance ? (
          <>
            <button type="button" disabled className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-slate-400 py-2 text-[12px] font-semibold text-white"><Lock className="h-3.5 w-3.5" /> {t('Bloquée')}</button>
            {canWrite && (
              <button type="button" onClick={() => onComplete(task)} title={t('Problème résolu : remettre la chambre en service')} aria-label={t('Problème résolu')} className="flex h-9 w-10 items-center justify-center rounded-md bg-red-500 text-white hover:bg-red-600"><CircleAlert className="h-4 w-4" /></button>
            )}
          </>
        ) : (
          <>
            {canWrite && (
              <button type="button" onClick={() => onComplete(task)} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-[#0b6b45] py-2 text-[12px] font-semibold text-white hover:bg-[#095c3b]"><CircleCheck className="h-4 w-4" /> {t('Marquer propre')}</button>
            )}
            {canWrite && (
              <button type="button" onClick={() => onReport(task)} title={t('Signaler un problème')} aria-label={t('Signaler un problème')} className="flex h-9 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50"><TriangleAlert className="h-4 w-4" /></button>
            )}
          </>
        )}
        {canManage && !maintenance && (
          <button type="button" onClick={() => onRemove(task)} aria-label={t('Supprimer')} title={t('Supprimer')} className="flex h-9 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-400"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
    </article>
  );
};

export default HousekeepingTaskCard;
