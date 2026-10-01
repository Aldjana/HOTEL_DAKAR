import { useEffect, useState } from 'react';
import { useT } from '../../../i18n';
import { Button, ImageUploadField, Input, Modal, Select } from '../../../components/ui';
import { useToast } from '../../../components/feedback/ToastProvider';
import { roomsApi } from '../../../services/api/roomsApi';
import { getErrorMessage } from '../../../services/api/client';
import { useRoomTypes } from '../../../hooks/useReference';

const EMPTY = { room_number: '', room_type_id: '', floor: '', base_price: '', max_adults: 2, max_children: 1, view: '', amenities: '', notes: '', image_url: '' };

const RoomFormModal = ({ isOpen, onClose, room = null, onSaved }) => {
  const { t } = useT();
  const toast = useToast();
  const types = useRoomTypes();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setForm(room ? { room_number: room.room_number, room_type_id: room.room_type_id?._id || room.room_type_id || '', floor: room.floor ?? '', base_price: room.base_price ?? '', max_adults: room.max_adults ?? 2, max_children: room.max_children ?? 1, view: room.view || '', amenities: (room.amenities || []).join(', '), notes: room.notes || '', image_url: room.image_url || '' } : EMPTY);
  }, [isOpen, room]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const pickType = (e) => {
    const ty = types.find((x) => x._id === e.target.value);
    setForm({ ...form, room_type_id: e.target.value, ...(ty && !room ? { base_price: form.base_price || ty.base_price, max_adults: ty.capacity_adults ?? form.max_adults, max_children: ty.capacity_children ?? form.max_children } : {}) });
  };

  const submit = async (e) => {
    e.preventDefault(); setError('');
    if (!form.room_number.trim()) return setError(t('Le numéro de chambre est requis'));
    if (!form.room_type_id) return setError(t('Choisissez un type de chambre'));
    const body = { ...form, floor: form.floor === '' ? undefined : Number(form.floor), base_price: form.base_price === '' ? undefined : Number(form.base_price), max_adults: Number(form.max_adults), max_children: Number(form.max_children), amenities: form.amenities.split(',').map((s) => s.trim()).filter(Boolean) };
    setSaving(true);
    try {
      const saved = room ? await roomsApi.update(room._id, body) : await roomsApi.create(body);
      toast.success(room ? t('Chambre mise à jour') : t('Chambre créée'));
      onSaved?.(saved); onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={room ? t('Modifier la chambre {n}', { n: room.room_number }) : t('Nouvelle chambre')} size="md">
      <form onSubmit={submit}>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Input label={t('Numéro')} required value={form.room_number} onChange={set('room_number')} />
          <Select label={t('Type')} required value={form.room_type_id} onChange={pickType}><option value="">{t('— Choisir —')}</option>{types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</Select>
          <Input label={t('Étage')} type="number" value={form.floor} onChange={set('floor')} />
          <Input label={t('Tarif par nuit (FCFA)')} type="number" min="0" value={form.base_price} onChange={set('base_price')} helperText={t('Vide = tarif du type')} />
          <Input label={t('Adultes max')} type="number" min="1" value={form.max_adults} onChange={set('max_adults')} />
          <Input label={t('Enfants max')} type="number" min="0" value={form.max_children} onChange={set('max_children')} />
          <Input label={t('Vue')} value={form.view} onChange={set('view')} />
          <Input label={t('Équipements (séparés par des virgules)')} value={form.amenities} onChange={set('amenities')} placeholder={t('Climatisation, Wi-Fi, TV')} />
        </div>
        <ImageUploadField className="mb-4" label={t('Photo de la chambre')} folder="rooms" value={form.image_url} onChange={(u) => setForm((x) => ({ ...x, image_url: u }))} onError={setError} previewClass="h-20 w-28" empty={t('Aucune photo')} />
        <Input label={t('Notes')} multiline rows={2} value={form.notes} onChange={set('notes')} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{room ? t('Enregistrer') : t('Créer la chambre')}</Button></div>
      </form>
    </Modal>
  );
};

export default RoomFormModal;
