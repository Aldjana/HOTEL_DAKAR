import { useEffect, useState } from 'react';
import { Button, Input, Modal, Select } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { reservationsApi } from '../../../services/api/reservationsApi';
import { roomsApi } from '../../../services/api/roomsApi';
import { getErrorMessage } from '../../../services/api/client';
import { formatMoney, toInputDate } from '../../../utils/format';
import { useT } from '../../../i18n';

// Changement de chambre : seules les chambres libres sur toute la durée du séjour sont proposées.
const ChangeRoomModal = ({ isOpen, onClose, reservation, onDone }) => {
  const { t } = useT();
  const toast = useToast();
  const { can } = useAuth();
  const [available, setAvailable] = useState([]);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [reason, setReason] = useState('');
  const [keepRate, setKeepRate] = useState(false);
  const [rate, setRate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const current = reservation?.room_details || [];
  useEffect(() => {
    if (!isOpen || !reservation) return;
    setFrom(String(current[0]?._id || reservation.room_id?._id || '')); setTo(''); setReason(''); setKeepRate(false); setRate(''); setError('');
    const start = reservation.status === 'checked_in' ? toInputDate(new Date()) : toInputDate(reservation.arrival_date);
    roomsApi.available({ start_date: start, end_date: toInputDate(reservation.departure_date), exclude_reservation_id: reservation._id })
      .then((r) => setAvailable(Array.isArray(r) ? r : r?.rooms || [])).catch((e) => setError(getErrorMessage(e)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, reservation?._id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!to) return setError(t('Choisissez la nouvelle chambre'));
    setSaving(true); setError('');
    try {
      await reservationsApi.changeRoom(reservation._id, { from_room_id: from, room_id: to, reason, keep_rate: keepRate, nightly_rate: rate ? Number(rate) : undefined });
      toast.success(t('Chambre modifiée, montants recalculés'));
      onDone?.(); onClose();
    } catch (err) { setError(getErrorMessage(err)); } finally { setSaving(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('Changer de chambre')} size="sm">
      <form onSubmit={submit}>
        {error && <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        {current.length > 1 && <Select label={t('Chambre à remplacer')} value={from} onChange={(e) => setFrom(e.target.value)}>{current.map((r) => <option key={r._id} value={r._id}>{t('Chambre {n}', { n: r.room_number })}</option>)}</Select>}
        <Select label={t('Nouvelle chambre')} required value={to} onChange={(e) => setTo(e.target.value)}>
          <option value="">{t('— Choisir —')}</option>
          {available.filter((r) => String(r._id) !== from).map((r) => <option key={r._id} value={r._id}>{r.room_number} · {r.room_type_id?.name || r.type?.name || ''} · {t('{price}/nuit', { price: formatMoney(r.base_price) })}</option>)}
        </Select>
        {available.length === 0 && <p className="-mt-2 mb-3 text-xs text-amber-700">{t('Aucune autre chambre libre sur cette période.')}</p>}
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={keepRate} onChange={(e) => setKeepRate(e.target.checked)} className="h-4 w-4 accent-emerald-500" /> {t('Conserver le tarif actuel')}</label>
        {can('reservations.price_override') && <Input label={t('Tarif par nuit imposé (optionnel)')} type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} />}
        <Input label={t('Motif')} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('Ex. : climatisation en panne')} />
        <div className="flex justify-end gap-2"><Button variant="ghost" onClick={onClose}>{t('Annuler')}</Button><Button type="submit" loading={saving}>{t('Changer de chambre')}</Button></div>
      </form>
    </Modal>
  );
};

export default ChangeRoomModal;
