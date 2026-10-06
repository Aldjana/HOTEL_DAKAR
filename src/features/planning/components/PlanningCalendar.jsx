import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, Layers, SlidersHorizontal } from 'lucide-react';
import { ErrorState, Spinner } from '../../../components/ui';
import { useAuth } from '../../../context/AuthContext';
import { useFetch } from '../../../hooks/useFetch';
import { useRoomTypes } from '../../../hooks/useReference';
import { reportsApi } from '../../../services/api/reportsApi';
import { RESERVATION_STATUS_LABELS } from '../../../constants/status';
import { addDaysStr, formatMoney, todayStr } from '../../../utils/format';
import { getLocale, useT } from '../../../i18n';

const roomStatusConfig = {
  available: { label: 'Disponible', color: '#0f9f6e', legend: '#0f9f6e' },
  reserved: { label: 'Réservée', color: '#3b82f6', legend: '#3b82f6' },
  occupied: { label: 'Occupée', color: '#0f172a', legend: '#0f172a' },
  cleaning: { label: 'À nettoyer', color: '#f97316', legend: '#f97316' },
  maintenance: { label: 'Maintenance', color: '#ef4444', legend: '#ef4444' },
  blocked: { label: 'Bloquée', color: '#6b7280', legend: '#6b7280' },
  checked_out: { label: 'Parti', color: '#6b7280', legend: '#6b7280' },
};

const legend = [
  { key: 'available', label: 'Disponible' },
  { key: 'reserved', label: 'Réservée' },
  { key: 'occupied', label: 'Occupée' },
  { key: 'cleaning', label: 'À nettoyer' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'blocked', label: 'Bloquée' },
];

const RESERVATION_KIND = { pending: 'reserved', confirmed: 'reserved', checked_in: 'occupied', checked_out: 'checked_out' };
const BAR_TITLE = { reserved: 'Réservation', occupied: 'Occupée', checked_out: 'Parti' };
// Bloc affiché aujourd'hui pour une chambre sans réservation (statut réel de la chambre)
const ROOM_BLOCK = {
  available: { kind: 'available', title: 'Libre', subtitle: 'Disponible' },
  clean: { kind: 'available', title: 'Libre', subtitle: 'Disponible' },
  cleaning: { kind: 'cleaning', title: 'Nettoyage', subtitle: 'En attente' },
  maintenance: { kind: 'maintenance', title: 'Indisponible', subtitle: 'Maintenance' },
  blocked: { kind: 'blocked', title: 'Bloquée', subtitle: '' },
  // Client toujours en chambre alors que sa date de départ est passée (aucune barre ne couvre aujourd'hui)
  occupied: { kind: 'occupied', title: 'Occupée', subtitle: 'Départ dépassé' },
  reserved: { kind: 'reserved', title: 'Réservée', subtitle: '' },
};

const WEEK = [7, 14, 30];
const day = (d) => String(d).slice(0, 10);
const parse = (s) => new Date(`${s}T00:00:00Z`);
const capitalize = (v) => v.charAt(0).toUpperCase() + v.slice(1);
const fmtMonth = (s) => new Intl.DateTimeFormat(getLocale(), { month: 'short', timeZone: 'UTC' }).format(parse(s));
const fmtWeekday = (s) => new Intl.DateTimeFormat(getLocale(), { weekday: 'long', timeZone: 'UTC' }).format(parse(s));
const formatDayMonth = (s) => `${Number(s.slice(8, 10))} ${capitalize(fmtMonth(s).replace('.', ''))}`;

const FilterSelect = ({ icon: Icon, label, value, onChange, options, className = 'min-w-[200px] flex-1' }) => (
  <label className={`flex ${className} items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600`}>
    <Icon className="h-4 w-4 text-slate-400" />
    <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</span>
    <select value={value} onChange={onChange} className="w-full min-w-0 border-0 bg-transparent text-[13px] font-medium text-slate-700 outline-none">
      {options.map((option) => (
        <option key={option.value} value={option.value}>{option.label}</option>
      ))}
    </select>
  </label>
);

const PlanningCalendar = () => {
  const { t } = useT();
  const navigate = useNavigate();
  const { can } = useAuth();
  const types = useRoomTypes();
  const today = todayStr();
  const [start, setStart] = useState(today);
  const [days, setDays] = useState(7);
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const { data, loading, error, reload } = useFetch(
    () => reportsApi.planning({ start, days, room_type_id: selectedRoomType || undefined }),
    [start, days, selectedRoomType],
  );
  const canBook = can('reservations.write');

  const dates = data?.days || [];
  const dayCount = dates.length || days;
  const end = addDaysStr(start, days - 1);
  const periodLabel = `${formatDayMonth(start)} — ${formatDayMonth(end)} ${end.slice(0, 4)}`;

  const roomTypeOptions = [{ value: '', label: t('Tous les types') }, ...types.map((rt) => ({ value: rt._id, label: rt.name }))];
  const statusOptions = [{ value: '', label: t('Tous les statuts') }, ...legend.map((item) => ({ value: item.key, label: t(item.label) }))];
  const daysOptions = WEEK.map((n) => ({ value: n, label: t('{n} jours', { n }) }));

  const getDayLabel = (d) => {
    if (d === today) return t("Aujourd'hui");
    if (d === addDaysStr(today, 1)) return t('Demain');
    return capitalize(fmtWeekday(d));
  };

  const rows = useMemo(() => (data?.rooms || []).map((room) => {
    const bars = [];
    room.reservations.forEach((res) => {
      const arrival = day(res.arrival_date);
      const departure = day(res.departure_date);
      let startIndex = data.days.findIndex((d) => d >= arrival);
      if (startIndex < 0 || data.days[startIndex] >= departure) return;
      let endIndex = startIndex;
      while (endIndex + 1 < data.days.length && data.days[endIndex + 1] < departure) endIndex += 1;
      bars.push({ res, startIndex, span: endIndex - startIndex + 1 });
    });
    const todayIndex = data.days.indexOf(today);
    const covered = todayIndex >= 0 && bars.some((b) => b.startIndex <= todayIndex && todayIndex < b.startIndex + b.span);
    const block = todayIndex >= 0 && !covered ? ROOM_BLOCK[room.status] : null;
    return { room, bars, block };
  }), [data, today]);

  const stats = useMemo(() => {
    if (!data || !data.days.includes(today)) return null;
    const seen = { arrivals: new Set(), departures: new Set() };
    data.rooms.forEach((room) => room.reservations.forEach((r) => {
      if (day(r.arrival_date) === today && ['pending', 'confirmed', 'checked_in'].includes(r.status)) seen.arrivals.add(r._id);
      if (day(r.departure_date) === today && ['checked_in', 'checked_out'].includes(r.status)) seen.departures.add(r._id);
    }));
    return { occupancy: data.occupancy.find((o) => o.date === today)?.rate, arrivals: seen.arrivals.size, departures: seen.departures.size };
  }, [data, today]);

  const shift = (n) => setStart((s) => addDaysStr(s, n));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative flex min-w-[240px] flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] text-slate-600">
          <CalendarDays className="h-4 w-4 text-slate-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t('Période')}</span>
          <span className="whitespace-nowrap font-medium text-slate-700">{periodLabel}</span>
          <input
            type="date"
            value={start}
            aria-label={t('Date de début')}
            onChange={(e) => e.target.value && setStart(e.target.value)}
            onClick={(e) => e.target.showPicker?.()}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <FilterSelect icon={Layers} label={t('Type de chambre')} className="min-w-[230px] flex-1" value={selectedRoomType} onChange={(e) => setSelectedRoomType(e.target.value)} options={roomTypeOptions} />
        <FilterSelect icon={SlidersHorizontal} label={t('Statut')} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={statusOptions} />
        <FilterSelect icon={CalendarRange} label={t('Durée')} className="min-w-[150px]" value={days} onChange={(e) => setDays(Number(e.target.value))} options={daysOptions} />

        <div className="ml-auto flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
          <button type="button" onClick={() => shift(-days)} className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50" aria-label={t('Période précédente')}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => setStart(today)} className="h-11 border-x border-slate-200 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50">
            {t("Aujourd'hui")}
          </button>
          <button type="button" onClick={() => shift(days)} className="flex h-11 w-11 items-center justify-center text-slate-500 hover:bg-slate-50" aria-label={t('Période suivante')}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-[12px] text-slate-500">
        {legend.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: roomStatusConfig[item.key].legend }} />
            {t(item.label)}
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : data.rooms.length === 0 ? (
          <p className="m-0 p-10 text-center text-[13px] text-slate-500">{t('Aucune chambre à afficher. Ajoutez des chambres dans « Chambres ».')}</p>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ minWidth: Math.max(980, 200 + dayCount * 90) }}>
              <div className="grid border-b border-slate-100 bg-[#f7f9fb]" style={{ gridTemplateColumns: `200px repeat(${dayCount}, minmax(0, 1fr))` }}>
                <div className="px-5 py-4 text-[13px] font-semibold text-slate-700">{t('Chambres')}</div>
                {dates.map((d) => {
                  const isTodayCol = d === today;
                  return (
                    <div key={d} className={`border-l border-slate-100 px-2 py-3 text-center ${isTodayCol ? 'bg-[#e8f8f1]' : ''}`}>
                      <div className={`text-[10px] font-semibold uppercase tracking-[0.12em] ${isTodayCol ? 'text-[#0f9f6e]' : 'text-slate-400'}`}>{getDayLabel(d)}</div>
                      <div className={`mt-1 text-[15px] font-semibold ${isTodayCol ? 'text-[#0f9f6e]' : 'text-slate-800'}`}>{formatDayMonth(d)}</div>
                    </div>
                  );
                })}
              </div>

              {rows.map(({ room, bars, block }) => {
                const bookable = canBook && !['maintenance', 'blocked'].includes(room.status);
                const book = (d) => navigate(`/reservations/new?room=${room._id}&arrival=${d}&departure=${addDaysStr(d, 1)}`);
                const dim = (kind) => selectedStatus && kind !== selectedStatus;
                return (
                  <div key={room._id} className="grid border-b border-slate-100 last:border-b-0" style={{ gridTemplateColumns: '200px minmax(0, 1fr)' }}>
                    <Link to={`/rooms/${room._id}`} className="flex flex-col justify-center px-5 py-5 no-underline">
                      <div className="text-[15px] font-semibold text-slate-800">{t('Chambre {n}', { n: room.room_number })}</div>
                      <div className="text-[12px] text-slate-400">{room.room_type}</div>
                    </Link>

                    <div className="relative" style={{ minHeight: 92 }}>
                      <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${dayCount}, minmax(0, 1fr))` }}>
                        {dates.map((d) => {
                          const cls = `border-0 border-l border-slate-100 ${d === today ? 'bg-[#f6fbf8]' : 'bg-transparent'}`;
                          return bookable ? (
                            <button key={d} type="button" title={t('Créer une réservation')} aria-label={t('Réserver la chambre {n} le {d}', { n: room.room_number, d })} onClick={() => book(d)} className={`${cls} cursor-pointer p-0 hover:bg-slate-50`} />
                          ) : <div key={d} className={cls} />;
                        })}
                      </div>

                      {block && (() => {
                        const config = roomStatusConfig[block.kind];
                        const Tag = block.kind === 'available' && bookable ? 'button' : 'div';
                        return (
                          <Tag
                            type={Tag === 'button' ? 'button' : undefined}
                            onClick={Tag === 'button' ? () => book(today) : undefined}
                            className={`absolute top-1/2 z-[1] -translate-y-1/2 rounded-lg border-0 px-3 py-2 text-left text-white shadow-sm ${dim(block.kind) ? 'opacity-30' : ''}`}
                            style={{ left: `calc(${(rowIndexOf(dates, today) / dayCount) * 100}% + 8px)`, width: `calc(${100 / dayCount}% - 16px)`, backgroundColor: config.color }}
                          >
                            <div className="truncate text-[10px] font-bold uppercase leading-4 tracking-[0.08em]">{t(block.title)}</div>
                            {block.subtitle && <div className="truncate text-[12px] leading-4">{t(block.subtitle)}</div>}
                          </Tag>
                        );
                      })()}

                      {bars.map(({ res, startIndex, span }) => {
                        const kind = RESERVATION_KIND[res.status] || 'reserved';
                        const config = roomStatusConfig[kind];
                        return (
                          <button
                            key={`${res._id}-${startIndex}`}
                            type="button"
                            onClick={() => navigate(`/reservations/${res._id}`)}
                            title={`${res.reservation_number} · ${RESERVATION_STATUS_LABELS[res.status]}${res.balance_amount > 0 ? ` · ${t('solde {a}', { a: formatMoney(res.balance_amount) })}` : ''}`}
                            className={`absolute top-1/2 z-[1] -translate-y-1/2 cursor-pointer rounded-lg border-0 px-3 py-2 text-left text-white shadow-sm ${dim(kind) ? 'opacity-30' : ''}`}
                            style={{ left: `calc(${(startIndex / dayCount) * 100}% + 8px)`, width: `calc(${(span / dayCount) * 100}% - 16px)`, backgroundColor: config.color }}
                          >
                            <div className="truncate text-[10px] font-bold uppercase leading-4 tracking-[0.08em]">{t(BAR_TITLE[kind])}</div>
                            <div className="truncate text-[12px] leading-4">{res.client_name}{res.balance_amount > 0 && ' •'}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 px-1 text-[13px] text-slate-500">
        <span>{t('Occupation:')} <strong className="font-semibold text-slate-700">{stats?.occupancy != null ? `${stats.occupancy}%` : '—'}</strong></span>
        <span>{t('Arrivées prévues:')} <strong className="font-semibold text-slate-700">{stats ? stats.arrivals : '—'}</strong></span>
        <span>{t('Départs:')} <strong className="font-semibold text-[#ef4444]">{stats ? stats.departures : '—'}</strong></span>
        <span className="ml-auto inline-flex items-center gap-2 text-[12px] text-slate-400">
          <span className="h-2 w-2 rounded-full bg-[#10B981]" />
          {t('Mise à jour en temps réel')}
        </span>
      </div>
    </div>
  );
};

const rowIndexOf = (dates, d) => Math.max(0, dates.indexOf(d));

export default PlanningCalendar;
