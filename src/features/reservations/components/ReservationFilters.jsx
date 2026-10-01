import { Search } from 'lucide-react';
import ExportButtons from '../../../components/common/ExportButtons';
import { RESERVATION_PAYMENT_LABELS, RESERVATION_STATUS_LABELS } from '../../../constants/status';
import { useT } from '../../../i18n';

const selectClass =
  'h-11 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium normal-case tracking-normal text-slate-700 outline-none';
const labelClass = 'flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-slate-400';

const ReservationFilters = ({ filters, sources, onFilterChange, exportParams }) => {
  const { t } = useT();
  const statusOptions = [
    { value: '', label: t('Tous') },
    ...Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const paymentOptions = [
    { value: '', label: t('Tous') },
    ...Object.entries(RESERVATION_PAYMENT_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const sourceOptions = [
    { value: '', label: t('Toutes') },
    ...sources.map((s) => ({ value: s.code, label: s.name })),
  ];

  return (
    <>
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="relative min-w-[280px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          placeholder={t('Rechercher par nom, chambre, N°...')}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-[13px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
        />
      </div>

      <label className={labelClass}>
        {t('Statut:')}
        <select value={filters.status} onChange={(e) => onFilterChange('status', e.target.value)} className={selectClass}>
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        {t('Source:')}
        <select value={filters.source} onChange={(e) => onFilterChange('source', e.target.value)} className={selectClass}>
          {sourceOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    </div>

    <div className="-mt-2 mb-5 flex flex-wrap items-center gap-3">
      <label className={labelClass}>
        {t('Paiement:')}
        <select value={filters.payment_status} onChange={(e) => onFilterChange('payment_status', e.target.value)} className={selectClass}>
          {paymentOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        {t('Du:')}
        <input type="date" value={filters.from} onChange={(e) => onFilterChange('from', e.target.value)} className={selectClass} />
      </label>

      <label className={labelClass}>
        {t('Au:')}
        <input type="date" value={filters.to} onChange={(e) => onFilterChange('to', e.target.value)} className={selectClass} />
      </label>

      <ExportButtons type="reservations" params={exportParams} />
    </div>
    </>
  );
};

export default ReservationFilters;
