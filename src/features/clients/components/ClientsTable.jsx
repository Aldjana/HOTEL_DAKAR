import { Eye, Phone } from 'lucide-react';
import { useT } from '../../../i18n';
import Pagination from '../../../components/ui/Pagination';
import { formatMoney } from '../../../utils/format';
import { CLIENT_AVATAR_COLORS, CLIENT_BADGE_CLASSES, clientBadge, clientInitials, formatStayDate } from '../constants/clientsData';

const ClientsTable = ({ clients, pagination, onPageChange, onOpen }) => {
  const { t, lang } = useT();
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Mobile : une carte par client */}
      <ul className="m-0 list-none divide-y divide-slate-100 p-0 md:hidden">
        {clients.map((client) => {
          const type = clientBadge(client);
          return (
            <li key={client._id}>
              <button type="button" onClick={() => onOpen(client)} className="flex w-full items-center gap-3 border-0 bg-transparent px-4 py-3 text-left">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${CLIENT_AVATAR_COLORS[type]}`}>{clientInitials(client)}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{`${client.first_name || ''} ${client.last_name || ''}`.trim()}</div>
                  <div className="truncate text-[12px] text-slate-400">{client.phone || client.email || '—'}</div>
                  <div className="text-[12px] text-slate-500">{t('Séjours')} : {client.reservations_count ?? 0} · {formatMoney(client.total_spent)}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${CLIENT_BADGE_CLASSES[type]}`}>{t(type)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[860px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              <th className="px-4 py-3 font-semibold">{lang === 'en' ? 'Name' : 'Nom'}</th>
              <th className="px-4 py-3 font-semibold">{t('Contact')}</th>
              <th className="px-4 py-3 font-semibold">{t('Type client')}</th>
              <th className="px-4 py-3 font-semibold">{t('Dernier séjour')}</th>
              <th className="px-4 py-3 font-semibold">{t('Séjours')}</th>
              <th className="px-4 py-3 font-semibold">{t('Montant total')}</th>
              <th className="px-4 py-3 font-semibold">{t('Action')}</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const type = clientBadge(client);
              return (
                <tr key={client._id} onClick={() => onOpen(client)} className="cursor-pointer border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-[11px] font-bold text-white ${CLIENT_AVATAR_COLORS[type]}`}>{clientInitials(client)}</div>
                      <div>
                        <div className="font-semibold">{`${client.first_name || ''} ${client.last_name || ''}`.trim()}</div>
                        <div className="text-[11px] text-slate-400">{client.company || `ID: #${client._id.slice(-5).toUpperCase()}`}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    <div>{client.phone || '—'}</div>
                    <div className="text-[12px]">{client.email || ''}</div>
                  </td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${CLIENT_BADGE_CLASSES[type]}`}>{t(type)}</span></td>
                  <td className="px-4 py-3">{formatStayDate(client.last_stay)}</td>
                  <td className="px-4 py-3">{client.reservations_count ?? 0}</td>
                  <td className="px-4 py-3 font-semibold">{formatMoney(client.total_spent)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 text-slate-400">
                      <button type="button" title={t('Voir la fiche')} onClick={(e) => { e.stopPropagation(); onOpen(client); }} className="border-0 bg-transparent p-0 text-slate-400"><Eye className="h-4 w-4" /></button>
                      {client.phone ? (
                        <a href={`tel:${client.phone.replace(/\s/g, '')}`} title={t('Appeler')} onClick={(e) => e.stopPropagation()} className="text-slate-400"><Phone className="h-4 w-4" /></a>
                      ) : <Phone className="h-4 w-4 opacity-40" />}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination pagination={pagination} onPageChange={onPageChange} label={t('clients')} />
    </section>
  );
};

export default ClientsTable;
