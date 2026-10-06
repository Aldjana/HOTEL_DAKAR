import { Link } from 'react-router-dom';
import { ROUTES, reservationPath } from '../../../constants/routes';
import { ROOM_STATUS_LABELS } from '../../../constants/status';
import { formatMoney, fullName, initials } from '../../../utils/format';
import { useT } from '../../../i18n';

const TwoLines = ({ text }) => {
  const i = text.indexOf(' ');
  return i < 0 ? text : <>{text.slice(0, i)}<br />{text.slice(i + 1)}</>;
};

const CheckOutAction = ({ r, canWrite }) => {
  const { t } = useT();
  if (r.status === 'checked_out') return <span className="text-[12px] font-semibold text-slate-400">{t('Parti')}</span>;
  if (!canWrite) return null;
  return (
    <Link
      to={reservationPath(r._id, 'check-out')}
      className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 no-underline hover:bg-slate-50"
    >
      {t('Check-out')}
    </Link>
  );
};

const DeparturesTable = ({ departures, canWrite }) => {
  const { t } = useT();
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="m-0 text-[16px] font-semibold text-slate-800">{t('Départs du jour')}</h2>
        <Link to={ROUTES.RESERVATIONS} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400 no-underline hover:text-slate-600">
          {t('Voir tout')}
        </Link>
      </div>

      {/* Mobile : cartes, le bouton Check-out reste visible sans défilement horizontal */}
      <ul className="m-0 list-none divide-y divide-slate-100 border-t border-slate-100 p-0 md:hidden">
        {departures.length === 0 && <li className="px-5 py-6 text-center text-[13px] text-slate-400">{t('Aucun départ prévu aujourd\'hui.')}</li>}
        {departures.map((r) => (
          <li key={r._id} className="flex items-center justify-between gap-3 px-5 py-3">
            <div className="min-w-0">
              <Link to={reservationPath(r._id)} className="block truncate text-[13px] font-semibold text-slate-800 no-underline">{fullName(r.client_id) || '—'}</Link>
              <div className="text-[12px] text-slate-400">
                {t('Chambre')} {r.room_id?.room_number || '—'}{r.rooms?.length > 1 ? ` +${r.rooms.length - 1}` : ''} · {ROOM_STATUS_LABELS[r.room_id?.status] || '—'}
              </div>
              <div className="text-[12px] font-semibold text-[#10B981]">{t('Solde')} : {formatMoney(r.balance_amount)}</div>
            </div>
            <CheckOutAction r={r} canWrite={canWrite} />
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[520px] border-collapse">
          <thead>
            <tr className="bg-[#f3f6f8] text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              <th className="px-5 py-3 font-semibold">{t('Client')}</th>
              <th className="px-3 py-3 font-semibold">{t('Chambre')}</th>
              <th className="px-3 py-3 font-semibold">{t('Solde')}</th>
              <th className="px-3 py-3 font-semibold">
                <TwoLines text={t('Statut chambre')} />
              </th>
              <th className="px-3 py-3 font-semibold">{t('Action')}</th>
            </tr>
          </thead>
          <tbody>
            {departures.length === 0 && (
              <tr className="border-t border-slate-100">
                <td colSpan={5} className="px-5 py-6 text-center text-[13px] text-slate-400">{t('Aucun départ prévu aujourd\'hui.')}</td>
              </tr>
            )}
            {departures.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8eef2] text-[11px] font-bold text-slate-500">
                      {initials(r.client_id)}
                    </div>
                    <Link to={reservationPath(r._id)} className="text-[13px] font-semibold leading-5 text-slate-800 no-underline hover:underline">
                      {fullName(r.client_id) || '—'}
                    </Link>
                  </div>
                </td>
                <td className="px-3 py-4 text-[13px] font-medium text-slate-700">
                  {r.room_id?.room_number || '—'}{r.rooms?.length > 1 ? ` +${r.rooms.length - 1}` : ''}
                </td>
                <td className="px-3 py-4 text-[13px] font-semibold text-[#10B981]">{formatMoney(r.balance_amount)}</td>
                <td className="px-3 py-4">
                  <span className="inline-flex rounded-md bg-[#d9ecfb] px-2.5 py-1 text-[11px] font-semibold text-[#2b6cb0]">
                    {ROOM_STATUS_LABELS[r.room_id?.status] || '—'}
                  </span>
                </td>
                <td className="px-3 py-4"><CheckOutAction r={r} canWrite={canWrite} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default DeparturesTable;
