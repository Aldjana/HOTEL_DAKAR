import { Globe, Plus } from 'lucide-react';
import { Spinner } from '../../../components/ui';
import { useFetch } from '../../../hooks/useFetch';
import { reservationSourcesApi, roomTypesApi, roomsApi } from '../../../services/api/roomsApi';
import { formatMoney } from '../../../utils/format';
import { useT } from '../../../i18n';
import RoomTypeCard from './RoomTypeCard';
import { useReferenceCrud } from './useReferenceCrud';

const TYPE_FIELDS = [
  { key: 'name', label: 'Nom', required: true }, { key: 'code', label: 'Code' },
  { key: 'base_price', label: 'Tarif de base par nuit (FCFA)', type: 'number', required: true, min: 0 },
  { key: 'capacity_adults', label: 'Adultes max', type: 'number', min: 1 }, { key: 'capacity_children', label: 'Enfants max', type: 'number', min: 0 },
  { key: 'description', label: 'Description' },
];
const typeBody = (f) => ({ ...f, base_price: Number(f.base_price), capacity_adults: Number(f.capacity_adults) || 2, capacity_children: Number(f.capacity_children) || 0 });
const SOURCE_FIELDS = [{ key: 'name', label: 'Nom', required: true }, { key: 'code', label: 'Code technique', required: true }, { key: 'commission_rate', label: 'Commission (%)', type: 'number', min: 0 }];
const sourceBody = (f) => ({ ...f, commission_rate: Number(f.commission_rate) || 0 });

const featuresOf = (ty, t) => [ty.capacity_children ? t('{a} adulte(s), {c} enfant(s)', { a: ty.capacity_adults ?? 2, c: ty.capacity_children }) : t('{a} adulte(s)', { a: ty.capacity_adults ?? 2 }), ty.description].filter(Boolean).join(' · ');

const ReferenceTab = ({ canDeleteTypes, canWriteSources, canDeleteSources }) => {
  const { t } = useT();
  const types = useReferenceCrud({ api: roomTypesApi, fields: TYPE_FIELDS, cacheKey: 'roomTypes', itemLabel: 'un type', toBody: typeBody });
  const sources = useReferenceCrud({ api: reservationSourcesApi, fields: SOURCE_FIELDS, cacheKey: 'sources', itemLabel: 'une source', toBody: sourceBody });
  const { data: rooms } = useFetch(() => roomsApi.list({ limit: 500 }).catch(() => null), []);
  const counts = {};
  (rooms?.items || []).forEach((r) => { const id = r.room_type_id?._id || r.room_type_id; if (id) counts[id] = (counts[id] || 0) + 1; });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm lg:col-span-7">
        <h3 className="mb-4 mt-0 text-[15px] font-semibold">{t('Types de chambres')}</h3>
        {types.loading && !types.items.length ? <Spinner /> : (
          <div className="grid grid-cols-2 gap-3">
            {types.items.map((ty) => {
              const n = counts[ty._id];
              return (
                <RoomTypeCard
                  key={ty._id}
                  name={ty.name}
                  units={rooms && n != null ? t(n > 1 ? '{n} UNITÉS' : '{n} UNITÉ', { n }) : rooms ? t('{n} UNITÉ', { n: 0 }) : undefined}
                  features={featuresOf(ty, t)}
                  price={t('{n} / nuit', { n: formatMoney(ty.base_price) })}
                  inactive={ty.is_active === false}
                  onEdit={() => types.open(ty)}
                  onRemove={canDeleteTypes ? () => types.remove(ty) : undefined}
                />
              );
            })}
            <button type="button" onClick={() => types.open(null)} className="flex min-h-[120px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400">
              <Plus className="mb-1 h-5 w-5" />
              {t('Nouveau type')}
            </button>
          </div>
        )}
      </section>

      <div className="space-y-4 lg:col-span-5">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
          <h3 className="mb-3 mt-0 flex items-center gap-2 text-[15px] font-semibold">
            <Globe className="h-4 w-4" /> {t('Sources de réservation')}
          </h3>
          {sources.loading && !sources.items.length ? <Spinner /> : (
            <div className="flex flex-wrap gap-2">
              {sources.items.map((s) => (
                <span key={s._id} title={t(s.is_active === false ? 'Commission : {n} % — inactive' : 'Commission : {n} %', { n: s.commission_rate || 0 })} className={`rounded-full border border-slate-200 px-3 py-1 text-[12px] ${s.is_active === false ? 'text-slate-300' : 'text-slate-600'}`}>
                  {canWriteSources ? <button type="button" onClick={() => sources.open(s)}>{s.name}</button> : s.name}
                  {canDeleteSources && <button type="button" aria-label={t('Supprimer')} onClick={() => sources.remove(s)} className="ml-1">×</button>}
                </span>
              ))}
              {canWriteSources && (
                <button type="button" onClick={() => sources.open(null)} className="rounded-full border border-dashed border-slate-300 px-3 py-1 text-[12px] text-slate-500">
                  {t('+ Source')}
                </button>
              )}
            </div>
          )}
        </section>
      </div>
      {types.modal}
      {sources.modal}
    </div>
  );
};

export default ReferenceTab;
