import { formatDay, formatNumber, fullName, initials } from '../../../utils/format';
import { RESERVATION_STATUS_LABELS } from '../../../constants/status';
import { tr, useT } from '../../../i18n';

const avatarPalette = ['bg-[#0D1520] text-white', 'bg-[#f5a623] text-white', 'bg-slate-400 text-white'];
const avatarClass = (name) => avatarPalette[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % avatarPalette.length];

const statusClasses = {
  pending: 'bg-slate-100 text-slate-500',
  confirmed: 'bg-[#d8f8ea] text-[#0f9f6e]',
  checked_in: 'bg-[#d9ecfb] text-[#2b6cb0]',
  checked_out: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-[#fde4e4] text-[#dc3b4e]',
  no_show: 'bg-[#fde4e4] text-[#dc3b4e]',
};

const roomsOf = (r) => {
  const numbers = r.rooms?.length > 1 ? r.rooms.map((l) => l.room_number).join(', ') : r.room_id?.room_number;
  return numbers ? tr('Ch. {n}', { n: numbers }) : '—';
};

const ReservationsTable = ({ reservations, onViewDetails }) => {
  const { t } = useT();
  return (
    <>
    {/* Mobile : une carte par réservation */}
    <ul className="m-0 list-none divide-y divide-slate-100 p-0 md:hidden">
      {reservations.map((row) => {
        const balance = Number(row.balance_amount) || 0;
        return (
          <li key={row._id}>
            <button type="button" onClick={() => onViewDetails(row._id)} className="flex w-full items-start justify-between gap-3 border-0 bg-transparent px-4 py-3 text-left">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-slate-800">{fullName(row.client_id) || t('Inconnu')}</div>
                <div className="text-[12px] text-slate-400">{row.reservation_number} · {roomsOf(row)}</div>
                <div className="text-[12px] text-slate-500">{formatDay(row.arrival_date)} → {formatDay(row.departure_date)}</div>
              </div>
              <div className="shrink-0 text-right">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusClasses[row.status] || 'bg-slate-100 text-slate-500'}`}>
                  {RESERVATION_STATUS_LABELS[row.status] || row.status}
                </span>
                <div className="mt-1 text-[13px] font-bold text-slate-800">{formatNumber(row.total_amount)}</div>
                {balance > 0 && <div className="text-[12px] font-semibold text-[#ef4444]">{t('Solde')} {formatNumber(balance)}</div>}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[860px] border-collapse">
        <thead>
          <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            <th className="px-5 py-3 font-semibold">
              {t('N°')}
              <br />
              {t('réservation')}
            </th>
            <th className="px-3 py-3 font-semibold">{t('Client')}</th>
            <th className="px-3 py-3 font-semibold">{t('Chambre')}</th>
            <th className="px-3 py-3 font-semibold">{t('Arrivée')}</th>
            <th className="px-3 py-3 font-semibold">{t('Départ')}</th>
            <th className="px-3 py-3 font-semibold">{t('Montant')}</th>
            <th className="px-3 py-3 font-semibold">{t('Payé')}</th>
            <th className="px-3 py-3 font-semibold">{t('Solde')}</th>
            <th className="px-3 py-3 font-semibold">
              {t('Statut')}
              <br />
              {t('rés.')}
            </th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((row) => {
            const name = fullName(row.client_id) || t('Inconnu');
            const paid = Number(row.paid_amount) || 0;
            const balance = Number(row.balance_amount) || 0;
            return (
              <tr
                key={row._id}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
                onClick={() => onViewDetails(row._id)}
              >
                <td className="px-5 py-4 text-[13px] font-bold text-slate-800">{row.reservation_number}</td>
                <td className="px-3 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${row.client_id ? avatarClass(name) : 'bg-slate-200 text-slate-600'}`}
                    >
                      {row.client_id ? initials(row.client_id) : '?'}
                    </div>
                    <span className="max-w-[120px] text-[13px] font-medium leading-5 text-slate-800">{name}</span>
                  </div>
                </td>
                <td className="px-3 py-4 text-[13px] text-slate-500">{roomsOf(row)}</td>
                <td className="px-3 py-4 text-[13px] text-slate-600">{formatDay(row.arrival_date)}</td>
                <td className="px-3 py-4 text-[13px] text-slate-600">{formatDay(row.departure_date)}</td>
                <td className="px-3 py-4 text-[13px] font-bold text-slate-800">{formatNumber(row.total_amount)}</td>
                <td className={`px-3 py-4 text-[13px] font-semibold ${paid > 0 ? 'text-[#0f9f6e]' : 'text-slate-500'}`}>
                  {formatNumber(paid)}
                </td>
                <td className={`px-3 py-4 text-[13px] font-semibold ${balance > 0 ? 'text-[#ef4444]' : 'text-slate-500'}`}>
                  {formatNumber(balance)}
                </td>
                <td className="px-3 py-4">
                  <span className={`inline-flex max-w-[88px] justify-center rounded-full px-2.5 py-1 text-center text-[10px] font-bold uppercase leading-4 ${statusClasses[row.status] || 'bg-slate-100 text-slate-500'}`}>
                    {RESERVATION_STATUS_LABELS[row.status] || row.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default ReservationsTable;
