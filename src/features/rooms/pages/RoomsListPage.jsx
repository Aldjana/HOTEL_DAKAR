import Pagination from '../../../components/ui/Pagination';
import { useState } from 'react';
import { useT } from '../../../i18n';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BedDouble, Pencil, Plus, Power, Search, SlidersHorizontal, Trash2, Users } from 'lucide-react';
import { Badge, Button, ErrorState, Modal, Select, Spinner } from '../../../components/ui';
import { EmptyState, StatusBadge } from '../../../components/common';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/feedback/ToastProvider';
import { useConfirm } from '../../../components/feedback/ConfirmProvider';
import { useFetch } from '../../../hooks/useFetch';
import { useRoomTypes } from '../../../hooks/useReference';
import { roomsApi } from '../../../services/api/roomsApi';
import { getErrorMessage } from '../../../services/api/client';
import { ROOM_MANUAL_STATUSES, ROOM_STATUS_LABELS } from '../../../constants/status';
import { formatDay, formatMoney, todayStr, toInputDate } from '../../../utils/format';
import { ROOM_STATUS_BADGE, roomImage, roomInitials, shortDate } from '../constants/roomsData';
import RoomStatsCard from '../components/RoomStatsCard';
import RoomFormModal from '../components/RoomFormModal';

const RoomsListPage = () => {
  const { id: openId } = useParams();
  const { t } = useT();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const { can } = useAuth();
  const types = useRoomTypes();
  const [f, setF] = useState({ search: '', status: '', room_type_id: '', floor: '' });
  const [advanced, setAdvanced] = useState(false);
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // room | 'new'
  const clean = Object.fromEntries(Object.entries(f).filter(([, v]) => v !== ''));
  const { data, loading, error, reload } = useFetch(() => roomsApi.list({ limit: 500, ...clean }), [f.search, f.status, f.room_type_id, f.floor]);
  const { data: stats, reload: reloadStats } = useFetch(() => roomsApi.statistics(), []);
  const { data: detail, reload: reloadDetail } = useFetch(() => roomsApi.get(openId), [openId], { enabled: !!openId });
  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setPage(1); };
  const PAGE_SIZE = 9;
  const roomCount = data?.items?.length || 0;
  const totalPages = Math.max(Math.ceil(roomCount / PAGE_SIZE), 1);
  const curPage = Math.min(page, totalPages);
  const pageItems = (data?.items || []).slice((curPage - 1) * PAGE_SIZE, curPage * PAGE_SIZE);
  const refresh = () => { reload(); reloadStats(); if (openId) reloadDetail(); };

  const act = async (fn, ok) => { try { await fn(); toast.success(ok); refresh(); } catch (err) { toast.error(getErrorMessage(err)); } };
  const remove = async (room) => { if (await confirm({ title: t('Supprimer la chambre {n} ?', { n: room.room_number }), message: t('Impossible si la chambre a des réservations : désactivez-la dans ce cas.'), confirmLabel: t('Supprimer'), danger: true })) { await act(() => roomsApi.remove(room._id), t('Chambre supprimée')); navigate('/rooms'); } };
  const floors = [...new Set((data?.items || []).map((r) => r.floor).filter((x) => x !== undefined && x !== null))].sort();

  const total = stats?.total || 0;
  const down = (stats?.maintenance || 0) + (stats?.blocked || 0);
  const goCheckIn = (room) => {
    const r = room.currentReservation || room.nextReservation;
    if (r?._id) navigate(`/reservations/${r._id}/check-in`);
  };
  const stop = (fn) => (e) => { e.stopPropagation(); fn(); };
  const btnLine = 'flex-1 rounded-lg border border-slate-200 py-2 text-[13px] font-semibold';
  const btnDark = 'flex-1 rounded-lg bg-[#0D1520] py-2 text-[13px] font-semibold text-white';
  const inputBox = 'h-11 rounded-xl border border-slate-200 bg-white px-3 text-[13px]';

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[28px] font-bold text-slate-900">{t('Chambres')}</h2>
          <p className="mt-1 text-[13px] text-slate-400">{t('Gérez les chambres, tarifs et statuts')}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setAdvanced((v) => !v)} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
            <SlidersHorizontal className="h-4 w-4" /> {t('Filtres avancés')}
          </button>
          {can('rooms.manage') && (
            <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-2 rounded-lg bg-[#0D1520] px-3 py-2 text-[13px] font-semibold text-white">
              <Plus className="h-4 w-4" /> {t('Ajouter une chambre')}
            </button>
          )}
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={f.search} onChange={set('search')} placeholder={t('Rechercher par N° ou type...')} className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] outline-none" />
        </div>
        <select value={f.room_type_id} onChange={set('room_type_id')} className={inputBox}>
          <option value="">{t('Tous les types')}</option>
          {types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
        </select>
        <select value={f.status} onChange={set('status')} className={inputBox}>
          <option value="">{t('Tous les statuts')}</option>
          {Object.entries(ROOM_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
        {(advanced || f.floor !== "") && (
          <select value={f.floor} onChange={set('floor')} className={inputBox}>
            <option value="">{t('Tous les étages')}</option>
            {floors.map((x) => <option key={x} value={x}>{t('Étage {n}', { n: x })}</option>)}
          </select>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <RoomStatsCard label={t('Total chambres')} value={total} meta={total ? t('{n}% en service', { n: Math.round(((total - down) / total) * 100) }) : undefined} metaClass="text-[#0f9f6e]" valueClass="" />
        <RoomStatsCard label={t('Disponibles')} value={stats?.available ?? '—'} meta={total ? t('{n}% du parc', { n: Math.round(((stats.available || 0) / total) * 100) }) : undefined} metaClass="text-[#0f9f6e]" />
        <RoomStatsCard label={t('En maintenance')} value={stats?.maintenance ?? '—'} meta={stats?.blocked ? t('Bloquées: {n}', { n: stats.blocked }) : undefined} metaClass="text-red-400" />
        <RoomStatsCard label={t("Taux d'occupation")} value={stats ? `${stats.occupancy_rate ?? 0}%` : '—'} meta={stats ? t('{n} occupée(s)', { n: stats.occupied || 0 }) : undefined} metaClass="text-red-400" />
      </div>

      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.items.length === 0 ? (
        <EmptyState icon={<BedDouble className="h-10 w-10" />} title={t('Aucune chambre')} message={Object.keys(clean).length ? t('Aucune chambre ne correspond aux filtres.') : t('Ajoutez vos chambres pour commencer à recevoir des réservations.')} action={!Object.keys(clean).length && can('rooms.manage') && <Button onClick={() => setEditing('new')}>{t('Nouvelle chambre')}</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {pageItems.map((room) => {
            const cur = room.currentReservation; const nxt = room.nextReservation;
            const badge = ROOM_STATUS_BADGE[room.status] || ROOM_STATUS_BADGE.available;
            const st = room.status;
            const res = cur || nxt;
            const arrival = res && (toInputDate(res.arrival_date) === todayStr() ? t("Aujourd'hui") : formatDay(res.arrival_date));
            const open = () => navigate(`/rooms/${room._id}`);
            return (
              <article key={room._id} onClick={open} className={`cursor-pointer overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm ${room.is_active === false ? 'opacity-60' : ''}`}>
                <div className="relative h-40">
                  <img src={roomImage(room)} alt="" className={`h-full w-full object-cover ${['maintenance', 'blocked'].includes(st) ? 'grayscale' : ''}`} />
                  <span className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[10px] font-bold uppercase ${badge.className}`}>{t(badge.label)}</span>
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-[11px] text-white">
                    <Users className="h-3 w-3" /> {room.capacity ?? (room.max_adults || 0) + (room.max_children || 0)}
                  </span>
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[18px] font-bold">{t('Ch. {n}', { n: room.room_number })}</div>
                      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">{room.room_type_id?.name || t('Type non défini')}{room.is_active === false && ' · ' + t('Désactivée')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatMoney(room.base_price)}</div>
                      <div className="text-[10px] uppercase text-slate-400">{t('Par nuit')}</div>
                    </div>
                  </div>

                  {st === 'occupied' && cur && (
                    <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2">
                      <div className="text-[10px] font-semibold uppercase text-slate-400">{t('Occupant actuel')}</div>
                      <div className="mt-1 flex items-center gap-2 text-[13px] font-semibold">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0D1520] text-[10px] text-white">{roomInitials(cur.client_name)}</span>
                        {cur.client_name}
                      </div>
                    </div>
                  )}
                  {['available', 'clean', 'cleaning'].includes(st) && nxt && <div className="mt-3 text-[12px] text-slate-500">{t('📅 Prochaine rés. : {d}', { d: shortDate(nxt.arrival_date) })}</div>}
                  {st === 'reserved' && res && (
                    <div className="mt-3 text-[12px] text-slate-500">
                      {t('Check-in prévu :')} <span className="font-semibold text-slate-800">{arrival}</span>
                    </div>
                  )}
                  {['maintenance', 'blocked'].includes(st) && room.notes && <div className="mt-3 text-[13px] font-semibold text-red-500">🔧 {room.notes}</div>}

                  <div className="mt-4 flex gap-2">
                    {['available', 'clean'].includes(st) && (
                      <>
                        <button type="button" onClick={stop(open)} className={btnLine}>{t('Détails')}</button>
                        {can('reservations.write') && room.is_active !== false && <button type="button" onClick={stop(() => navigate(`/reservations/new?room=${room._id}`))} className={btnDark}>{t('Réserver')}</button>}
                      </>
                    )}
                    {st === 'occupied' && (
                      <button type="button" onClick={stop(() => (cur?.client_id?._id ? navigate(`/clients/${cur.client_id._id}`) : open()))} className={btnLine}>{t('Fiche Client')}</button>
                    )}
                    {st === 'reserved' && (
                      <>
                        <button type="button" onClick={stop(open)} className={btnLine}>{t('Détails')}</button>
                        {can('reservations.write') && res?._id && <button type="button" onClick={stop(() => goCheckIn(room))} className="flex-1 rounded-lg bg-[#0f9f6e] py-2 text-[13px] font-semibold text-white">{t('Check-in')}</button>}
                      </>
                    )}
                    {st === 'cleaning' && <button type="button" onClick={stop(open)} className={btnLine}>{t('Détails')}</button>}
                    {['maintenance', 'blocked'].includes(st) && (
                      <button type="button" onClick={stop(open)} className="w-full rounded-lg bg-[#0D1520] py-2 text-[13px] font-semibold text-white">{t('Gérer Maintenance')}</button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
      {data && roomCount > PAGE_SIZE && <Pagination centered pagination={{ page: curPage, limit: PAGE_SIZE, total: roomCount, totalPages }} onPageChange={setPage} />}

      <Modal isOpen={!!openId} onClose={() => navigate('/rooms')} title={detail ? t('Chambre {n}', { n: detail.room_number }) : t('Chambre')} size="md">
        {!detail || detail._id !== openId ? <Spinner /> : (
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2"><StatusBadge status={detail.status} type="room" />{detail.is_active === false && <Badge>{t('Désactivée')}</Badge>}<span className="text-sm text-slate-500">{t('{type} · {price} / nuit · {a} adulte(s), {c} enfant(s)', { type: detail.room_type_id?.name ?? '', price: formatMoney(detail.base_price), a: detail.max_adults ?? '', c: detail.max_children ?? '' })}</span></div>
            {detail.currentReservation && <div className="mb-4 rounded-lg border border-slate-200 p-3 text-sm"><p className="m-0 text-xs uppercase text-slate-500">{detail.status === 'occupied' ? t('Occupant actuel') : t('Réservation en cours')}</p><Link to={`/reservations/${detail.currentReservation._id}`} className="font-semibold text-slate-800 no-underline hover:underline">{detail.currentReservation.client_name}</Link><p className="m-0 text-slate-500">{formatDay(detail.currentReservation.arrival_date)} → {formatDay(detail.currentReservation.departure_date)} · {detail.currentReservation.reservation_number}</p></div>}
            {detail.upcoming_reservations?.length > 0 && <div className="mb-4"><p className="m-0 mb-1 text-xs uppercase text-slate-500">{t('Réservations à venir')}</p>{detail.upcoming_reservations.map((r) => <Link key={r._id} to={`/reservations/${r._id}`} className="flex justify-between border-b border-slate-100 py-1.5 text-sm text-slate-700 no-underline hover:bg-slate-50"><span>{r.client_id ? `${r.client_id.first_name} ${r.client_id.last_name}` : t('Client')}</span><span className="text-slate-500">{formatDay(r.arrival_date)} → {formatDay(r.departure_date)}</span></Link>)}</div>}
            {detail.amenities?.length > 0 && <p className="text-sm text-slate-600"><b>{t('Équipements :')}</b> {detail.amenities.join(', ')}</p>}
            {can('housekeeping.write') && ['occupied', 'reserved'].indexOf(detail.status) === -1 && (
              <Select label={t('Changer le statut')} value={ROOM_MANUAL_STATUSES.includes(detail.status) ? detail.status : detail.stored_status} onChange={(e) => act(() => roomsApi.setStatus(detail._id, e.target.value), t('Statut mis à jour'))}>{ROOM_MANUAL_STATUSES.map((s) => <option key={s} value={s}>{ROOM_STATUS_LABELS[s]}</option>)}</Select>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
              {can('reservations.write') && detail.is_active !== false && !['maintenance', 'blocked'].includes(detail.status) && <Button onClick={() => navigate(`/reservations/new?room=${detail._id}`)}>{t('Réserver')}</Button>}
              {can('rooms.manage') && <>
                <Button variant="outline" onClick={() => setEditing(detail)}><Pencil className="h-4 w-4" /> {t('Modifier')}</Button>
                <Button variant="outline" onClick={() => act(() => roomsApi.setActive(detail._id, detail.is_active === false), detail.is_active === false ? t('Chambre activée') : t('Chambre désactivée'))}><Power className="h-4 w-4" /> {detail.is_active === false ? t('Activer') : t('Désactiver')}</Button>
                <Button variant="danger-outline" onClick={() => remove(detail)}><Trash2 className="h-4 w-4" /> {t('Supprimer')}</Button>
              </>}
            </div>
          </div>
        )}
      </Modal>
      <RoomFormModal isOpen={!!editing} onClose={() => setEditing(null)} room={editing === 'new' ? null : editing} onSaved={refresh} />
    </div>
  );
};

export default RoomsListPage;
