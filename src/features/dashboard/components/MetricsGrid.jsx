import { Broom, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../constants/routes';
import { formatMoney } from '../../../utils/format';
import { useT } from '../../../i18n';

const TwoLines = ({ text }) => {
  const i = text.indexOf(' ');
  return i < 0 ? text : <>{text.slice(0, i)}<br />{text.slice(i + 1)}</>;
};

const pad = (n) => String(n ?? 0).padStart(2, '0');

const MetricsGrid = ({ data, showMoney = true }) => {
  const { t } = useT();
  const rooms = data.rooms || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-2xl bg-[#0D1520] px-5 py-4 text-white shadow-sm">
          <div className="text-[11px] font-semibold uppercase leading-4 tracking-[0.08em] text-slate-400">
            <TwoLines text={t("Taux d'occupation")} />
          </div>
          <div className="mt-3 text-[32px] font-bold leading-none text-[#10B981]">{data.occupancy_rate ?? 0} %</div>
          <div className="mt-3 flex items-center gap-1 text-[12px] font-medium text-[#10B981]">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{t('{occupied} / {total} chambres', { occupied: rooms.occupied ?? 0, total: rooms.total ?? 0 })}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('Disponibles')}</div>
          <div className="mt-3 text-[32px] font-bold leading-none text-slate-900">{pad(rooms.available)}</div>
          <div className="mt-4 h-1.5 w-12 rounded-full bg-[#10B981]" />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('Occupées')}</div>
          <div className="mt-3 text-[32px] font-bold leading-none text-slate-900">{pad(rooms.occupied)}</div>
          <div className="mt-4 h-1.5 w-16 rounded-full bg-slate-800" />
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('Réservées')}</div>
          <div className="mt-3 text-[32px] font-bold leading-none text-slate-900">{pad(rooms.reserved)}</div>
          <div className="mt-4 h-1.5 w-10 rounded-full bg-[#f5a623]" />
        </div>

        <div className="relative rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <Broom className="absolute right-4 top-4 h-4 w-4 text-[#ef4444]" />
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('À nettoyer')}</div>
          <div className="mt-3 text-[32px] font-bold leading-none text-[#ef4444]">{pad(rooms.cleaning)}</div>
        </div>
      </div>

      <div className={`grid grid-cols-1 gap-4 ${showMoney ? 'md:grid-cols-[1.7fr_1fr_1fr]' : 'md:grid-cols-2'}`}>
        {showMoney && (
          <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('Encaissements du jour')}</div>
            <div className="mt-3 text-[28px] font-bold leading-none text-[#10B981]">{formatMoney(data.revenue_today)}</div>
            <div className="mt-6 flex items-start justify-between gap-4">
              <div>
                <div className="text-[13px] text-slate-400">{t('Solde à encaisser')}</div>
                <div className="mt-1 text-[16px] font-semibold text-slate-800">{formatMoney(data.unpaid_total)}</div>
              </div>
              <Link to={ROUTES.PAYMENTS} className="text-[13px] font-medium text-slate-500 no-underline hover:text-slate-800">
                {t('Voir détails →')}
              </Link>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('Arrivées')}</div>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-[32px] font-bold leading-none text-slate-900">{pad(data.arrivals_count)}</span>
            <span className="pb-1 text-[13px] text-slate-400">check-ins</span>
          </div>
          {data.upcoming_count !== undefined && (
            <Link to={ROUTES.RESERVATIONS} className="mt-3 block text-[13px] text-slate-500 no-underline hover:text-slate-800">
              {t('{n} réservation(s) à venir (7 jours)', { n: data.upcoming_count })}
            </Link>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">{t('Départs')}</div>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-[32px] font-bold leading-none text-slate-900">{pad(data.departures_count)}</span>
            <span className="pb-1 text-[13px] text-slate-400">check-outs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsGrid;
