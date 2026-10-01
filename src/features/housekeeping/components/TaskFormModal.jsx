import { useEffect, useState } from 'react';
import { useT } from '../../../i18n';
import { Button, Input, Modal, Select } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { housekeepingApi } from '../../../services/api/housekeepingApi';
import { roomsApi } from '../../../services/api/roomsApi';
import { getErrorMessage } from '../../../services/api/client';
import { PRIORITY_LABELS, TASK_TYPE_LABELS } from '../../../constants/status';
import { fullName, todayStr } from '../../../utils/format';

const TaskFormModal = ({ isOpen, onClose, staff = [], onSaved, canAssign }) => {
  const { t } = useT();
  const toast = useToast();
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState({ room_id: '', task_type: 'cleaning', priority: 'medium', assigned_to: '', scheduled_date: todayStr(), notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError(''); setForm({ room_id: '', task_type: 'cleaning', priority: 'medium', assigned_to: '', scheduled_date: todayStr(), notes: '' });
    roomsApi.list({ limit: 500, is_active: 'true' }).then((r) => setRooms(r.items)).catch(() => {});
  }, [isOpen]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.room_id) return setError(t('Choisissez une chambre'));
    setSaving(true);
    try { await housekeepingApi.create({ ...form, assigned_to: form.assigned_to || undefined }); toast.success(t('Tâche créée')); onSaved?.(); onClose(); }
    catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Nouvelle tâche')} size="sm">
      <form onSubmit={submit}>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <Select label={t('Chambre')} required value={form.room_id} onChange={set('room_id')}><option value="">{t('— Choisir —')}</option>{rooms.map((r) => <option key={r._id} value={r._id}>{r.room_number} · {r.room_type_id?.name}</option>)}</Select>
        <Select label={t('Type')} value={form.task_type} onChange={set('task_type')} options={Object.entries(TASK_TYPE_LABELS).map(([value, label]) => ({ value, label }))} />
        <Select label={t('Priorité')} value={form.priority} onChange={set('priority')} options={Object.entries(PRIORITY_LABELS).map(([value, label]) => ({ value, label }))} />
        {canAssign && <Select label={t('Assignée à')} value={form.assigned_to} onChange={set('assigned_to')}><option value="">{t('Non assignée')}</option>{staff.map((u) => <option key={u._id} value={u._id}>{fullName(u)}</option>)}</Select>}
        <Input label={t('Date prévue')} type="date" value={form.scheduled_date} onChange={set('scheduled_date')} />
        <Input label={t('Notes')} multiline rows={2} value={form.notes} onChange={set('notes')} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Créer')}</Button></div>
      </form>
    </Modal>
  );
};

export default TaskFormModal;
