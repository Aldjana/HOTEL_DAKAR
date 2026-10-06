import { Link } from 'react-router-dom';
import { ROUTES, reservationPath } from '../../../constants/routes';
import { RESERVATION_PAYMENT_LABELS } from '../../../constants/status';
import { fullName, initials } from '../../../utils/format';
import { useT, getLocale } from '../../../i18n';

const paidClasses = 'bg-[#d8f8ea] text-[#0f9f6e]';
const statusClasses = { unpaid: 'bg-[#fde4e4] text-[#dc3b4e]' };

const TwoLines = ({ text }) => {
  const i = text.indexOf(' ');
  return i < 0 ? text : <>{text.slice(0, i)}<br />{text.slice(i + 1)}</>;
};

const CheckInAction = ({ r, canWrite }) => {
  const { t } = useT();
  if (r.status === 'checked_in') return <span className="text-[12px] font-semibold text-slate-400">{t('Arrivé')}</span>;
  if (!canWrite) return null;
  return (
    <Link
      to={reservationPath(r._id, 'check-in')}
      className="inline-flex min-w-[72px] items-center justify-center rounded-lg bg-[#0D1520] px-3 py-2 text-center text-[12px] font-semibold leading-4 text-white no-underline"
    >
      {t('Check-in')}
    </Link>
  );
};

const ArrivalsTable = ({ arrivals, canWrite }) => {
  const { t } = useT();
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="m-0 text-[16px] font-semibold text-slate-800">{t('Arrivées du jour')}</h2>
        <Link to={ROUTES.RESERVATIONS} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 no-underline hover:text-slate-600">
          {t('Voir tout')}
        </Link>
      </div>

      {/* Mobile : cartes, le bouton Check-in reste visible sans défilement horizontal */}
      <ul className="m-0 list-none divide-y divide-slate-100 border-t border-slate-100 p-0 md:hidden">
        {arrivals.length === 0 && <li className="px-5 py-6 text-center text-[13px] text-slate-400">{t('Aucune arrivée prévue aujourd\'hui.')}</li>}
        {arrivals.map((r) => (
          <li key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <Link to={reservationPath(r._id)} className="block truncate text-[13px] font-semibold text-slate-800 no-underline">{fullName(r.client_id) || '—'}</Link>
              <div className="text-[12px] text-slate-400">
                {t('Chambre')} {r.room_id?.room_number || '—'}{r.rooms?.length > 1 ? ` +${r.rooms.length - 1}` : ''}
                {r.room_id?.room_type_id?.name ? ` (${r.room_id.room_type_id.name})` : ''}
              </div>
              <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold ${statusClasses[r.payment_status] || paidClasses}`}>
                {RESERVATION_PAYMENT_LABELS[r.payment_status] || '—'}
              </span>
            </div>
            <CheckInAction r={r} canWrite={canWrite} />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="bg-[#f3f6f8] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <th className="px-5 py-3 font-semibold">{t('Client')}</th>
              <th className="px-3 py-3 font-semibold">{t('Chambre')}</th>
              <th className="px-3 py-3 font-semibold">
                <TwoLines text={t('Heure prévue')} />
              </th>
              <th className="px-3 py-3 font-semibold">
                <TwoLines text={t('Statut paiement')} />
              </th>
              <th className="px-3 py-3 font-semibold">{t('Action')}</th>
            </tr>
          </thead>
          <tbody>
            {arrivals.length === 0 && (
              <tr className="border-t border-slate-100">
                <td colSpan={5} className="px-5 py-6 text-center text-[13px] text-slate-400">{t('Aucune arrivée prévue aujourd\'hui.')}</td>
              </tr>
            )}
            {arrivals.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8eef2] text-[11px] font-bold text-slate-500">
                      {initials(r.client_id)}
                    </div>
                    <Link to={reservationPath(r._id)} className="max-w-[110px] text-[13px] font-semibold leading-5 text-slate-800 no-underline hover:underline">
                      {fullName(r.client_id) || '—'}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div className="text-[13px] font-medium text-slate-700">
                    {r.room_id?.room_number || '—'}{r.rooms?.length > 1 ? ` +${r.rooms.length - 1}` : ''}
                  </div>
                  {r.room_id?.room_type_id?.name && <div className="text-[12px] text-slate-400">({r.room_id.room_type_id.name})</div>}
                </td>
                <td className="px-3 py-4 text-[13px] text-slate-600">{r.check_in_time ? new Date(r.check_in_time).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                <td className="px-3 py-4">
                  <span className={`inline-flex max-w-[88px] justify-center rounded-md px-2 py-1 text-center text-[11px] font-semibold leading-4 ${statusClasses[r.payment_status] || paidClasses}`}>
                    {RESERVATION_PAYMENT_LABELS[r.payment_status] || '—'}
                  </span>
                </td>
                <td className="px-3 py-4"><CheckInAction r={r} canWrite={canWrite} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ArrivalsTable;
