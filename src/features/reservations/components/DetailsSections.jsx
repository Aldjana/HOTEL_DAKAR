import { Link } from 'react-router-dom';
import { BedDouble, CheckCircle2, Clock3, CreditCard, Download, FileText, Folder, MapPin, Phone, Plus, ShieldCheck, User } from 'lucide-react';
import { CLIENT_TYPE_LABELS, paymentMethodLabel } from '../../../constants/status';
import { fullName, initials } from '../../../utils/format';
import { dateLong, dateTimeLong, moneyDE, rateLabel, roomTypeName } from './DetailsFormat';
import { getLocale, tr, useT } from '../../../i18n';

const sectionCls = 'rounded-2xl border border-slate-100 bg-white p-5 shadow-sm';
const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400';

export const DetailsClientCard = ({ client }) => {
  const { t } = useT();
  return (
  <section className={sectionCls}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="m-0 text-[14px] font-semibold text-slate-700">{t('Infos client')}</h2>
      <User className="h-4 w-4 text-slate-300" />
    </div>
    <div className="flex items-start gap-3">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-[16px] font-bold text-slate-500">{initials(client)}</div>
      <div>
        <Link to={`/clients/${client?._id}`} className="font-semibold text-slate-800 no-underline hover:underline">{fullName(client) || '—'}</Link>
        <div className="text-[12px] text-slate-400">{client?.email || '—'}</div>
        {(CLIENT_TYPE_LABELS[client?.client_type] || client?.company) && (
          <div className="text-[12px] text-slate-400">{[CLIENT_TYPE_LABELS[client?.client_type], client?.company].filter(Boolean).join(' · ')}</div>
        )}
      </div>
    </div>
    <div className="mt-4 space-y-2 text-[13px] text-slate-600">
      <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {client?.phone || '—'}</div>
      <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {client?.nationality || '—'}</div>
      {client?.is_vip && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ece7ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6d5bd0]">
          <ShieldCheck className="h-3 w-3" /> {t('Client VIP')}
        </span>
      )}
    </div>
  </section>
  );
};

export const DetailsStayCard = ({ r, rooms, hotel, canChange, onChangeRoom }) => {
  const { t } = useT();
  const arrivalSub = r.check_in_time ? t('Check-in : {time}', { time: new Date(r.check_in_time).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) }) : hotel?.check_in_time ? t('À partir de {time}', { time: hotel.check_in_time }) : '';
  const departureSub = r.check_out_time ? t('Check-out : {time}', { time: new Date(r.check_out_time).toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' }) }) : hotel?.check_out_time ? t('Avant {time}', { time: hotel.check_out_time }) : '';
  const people = [t(r.adults_count > 1 ? '{n} Adultes' : '{n} Adulte', { n: r.adults_count }), r.children_count > 0 && t(r.children_count > 1 ? '{n} Enfants' : '{n} Enfant', { n: r.children_count })].filter(Boolean).join(', ');
  return (
    <section className={sectionCls}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[14px] font-semibold text-slate-700">{t('Infos séjour')}</h2>
        <BedDouble className="h-4 w-4 text-slate-300" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className={labelCls}>{t('Arrivée')}</div>
          <div className="mt-1 font-semibold text-slate-800">{dateLong(r.arrival_date)}</div>
          <div className="text-[12px] text-slate-400">{arrivalSub || ' '}</div>
        </div>
        <div>
          <div className={labelCls}>{t('Départ')}</div>
          <div className="mt-1 font-semibold text-slate-800">{dateLong(r.departure_date)}</div>
          <div className="text-[12px] text-slate-400">{departureSub || ' '}</div>
        </div>
        <div>
          <div className={labelCls}>{t('Durée')}</div>
          <div className="mt-1 font-semibold text-slate-800">{t(r.nights > 1 ? '{n} Nuits' : '{n} Nuit', { n: r.nights })}</div>
          {r.rate_type && <div className="text-[12px] font-semibold text-[#0f9f6e]">● {r.price_overridden ? t('Tarif manuel') : rateLabel(r.rate_type)}</div>}
        </div>
      </div>
      {rooms.map((rm) => {
        const line = r.rooms?.find((l) => String(l.room_id) === String(rm._id));
        return (
          <div key={rm._id} className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0D1520] text-white">
                <BedDouble className="h-4 w-4" />
              </div>
              <div>
                <Link to={`/rooms/${rm._id}`} className="font-semibold text-slate-800 no-underline hover:underline">{t('Chambre {n}', { n: rm.room_number })}{roomTypeName(rm) && ` — ${roomTypeName(rm)}`}</Link>
                <div className="text-[12px] text-slate-400">{people}{line ? ` • ${t('{price}/nuit', { price: moneyDE(line.nightly_rate) })}` : ''}</div>
              </div>
            </div>
            {canChange && <button type="button" onClick={onChangeRoom} className="cursor-pointer border-none bg-transparent text-[13px] font-semibold text-slate-500">{t('Changer chambre')}</button>}
          </div>
        );
      })}
      {r.guests?.length > 0 && (
        <div className="mt-4 text-[13px] text-slate-600">
          <div className={labelCls}>{t('Personnes accompagnantes')}</div>
          <ul className="m-0 mt-1 list-none space-y-1 p-0">
            {r.guests.map((g, i) => <li key={i}>{g.full_name}{g.is_child && ` ${t('(enfant)')}`}{g.id_document_number && ` — ${g.id_document_number}`}</li>)}
          </ul>
        </div>
      )}
      {(r.special_requests || r.notes) && (
        <div className="mt-4 whitespace-pre-line rounded-xl bg-slate-50 px-4 py-3 text-[12px] text-slate-500">
          {r.special_requests && <div><b className="text-slate-700">{t('Demandes :')}</b> {r.special_requests}</div>}
          {r.notes && <div><b className="text-slate-700">{t('Notes :')}</b> {r.notes}</div>}
        </div>
      )}
      {r.cancellation_reason && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600"><b>{t('Motif :')}</b> {r.cancellation_reason}</div>}
    </section>
  );
};

const TX_STATUS = {
  completed: 'bg-[#d8f8ea] text-[#0f9f6e]',
  pending: 'bg-[#fde9c8] text-[#c47a12]',
  failed: 'bg-red-50 text-red-500',
};

export const DetailsPaymentsCard = ({ r, payMethods, statusLabels }) => {
  const { t } = useT();
  const payments = r.payments || [];
  return (
    <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <h2 className="m-0 text-[14px] font-semibold text-slate-700">{t('Paiements & Transactions')}</h2>
        <div className="flex gap-6 text-right">
          <div>
            <div className={labelCls}>{t('Total')}</div>
            <div className="font-bold text-slate-800">{moneyDE(r.total_amount)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0f9f6e]">{t('Payé')}</div>
            <div className="font-bold text-[#0f9f6e]">{moneyDE(r.paid_amount)}</div>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-500">{t('Solde')}</div>
            <div className="font-bold text-red-500">{moneyDE(Math.max(r.balance_amount || 0, 0))}</div>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-400">
              <th className="py-2 font-semibold">{t('ID Transaction')}</th>
              <th className="py-2 font-semibold">{t('Date')}</th>
              <th className="py-2 font-semibold">{t('Méthode')}</th>
              <th className="py-2 font-semibold">{t('Statut')}</th>
              <th className="py-2 text-right font-semibold">{t('Montant')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((tx) => {
              const refund = tx.type === 'refund';
              const status = refund ? 'refunded' : tx.payment_status;
              return (
                <tr key={tx._id} className="border-t border-slate-100">
                  <td className="py-3 font-bold">{tx.transaction_id || tx.receipt_number || '—'}</td>
                  <td className="py-3 text-slate-500">{dateTimeLong(tx.payment_date)}</td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2"><CreditCard className="h-4 w-4" /> {paymentMethodLabel(tx.payment_method, payMethods)}</span>
                    {tx.reference && <span className="block text-[11px] text-slate-400">{tx.reference}</span>}
                  </td>
                  <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TX_STATUS[status] || 'bg-slate-100 text-slate-500'}`}>{statusLabels[status] || status}</span></td>
                  <td className={`py-3 text-right font-semibold ${refund ? 'text-red-500' : ''}`}>{refund ? '−' : ''}{moneyDE(tx.amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 text-center text-[12px] text-slate-400">{payments.length ? t('--- Aucune autre transaction enregistrée ---') : t('--- Aucune transaction enregistrée ---')}</div>
    </section>
  );
};

const DocItem = ({ name, kind, date, onClick, to }) => {
  const inner = (
    <>
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-slate-400" />
        <div>
          <div className="text-[12px] font-semibold text-slate-800">{name}</div>
          <div className="text-[11px] text-slate-400">{kind} • {date}</div>
        </div>
      </div>
      <Download className="h-4 w-4 text-slate-400" />
    </>
  );
  const cls = 'flex min-w-[180px] flex-1 items-center justify-between rounded-xl border border-slate-100 bg-transparent px-3 py-3 text-left no-underline';
  return to ? <Link to={to} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={`${cls} cursor-pointer`}>{inner}</button>;
};

export const DetailsDocumentsCard = ({ r, onPdf }) => {
  const { t } = useT();
  const invoices = r.invoices || [];
  const receipts = (r.payments || []).filter((p) => p.receipt_number);
  return (
    <section className={sectionCls}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="m-0 text-[14px] font-semibold text-slate-700">{t('Documents')}</h2>
        <Folder className="h-4 w-4 text-slate-300" />
      </div>
      <div className="flex flex-wrap gap-3">
        <DocItem name={t('Récapitulatif_{n}.pdf', { n: r.reservation_number })} kind={t('Récapitulatif')} date={dateLong(r.updatedAt || r.createdAt)} onClick={() => onPdf(`/reservations/${r._id}/summary-pdf`)} />
        {invoices.map((i) => <DocItem key={i._id} to={`/invoices/${i._id}`} name={`${i.invoice_number}.pdf`} kind={i.type === 'proforma' ? t('Proforma') : t('Facture')} date={dateLong(i.issue_date || i.createdAt)} />)}
        {receipts.map((p) => <DocItem key={p._id} name={`${p.receipt_number}.pdf`} kind={t('Paiement')} date={dateLong(p.payment_date)} onClick={() => onPdf(`/payments/${p._id}/receipt`)} />)}
      </div>
    </section>
  );
};

const TONE = { payment: 'success', check_in: 'success', check_out: 'success', create: 'create' };
export const DetailsHistoryCard = ({ history, actionLabels }) => {
  const { t } = useT();
  return (
  <section className={sectionCls}>
    <div className="mb-4 flex items-center justify-between">
      <h2 className="m-0 text-[14px] font-semibold text-slate-700">{t('Historique')}</h2>
      <Clock3 className="h-4 w-4 text-slate-300" />
    </div>
    <div className="max-h-80 space-y-4 overflow-y-auto">
      {history.length === 0 && <div className="text-[12px] text-slate-400">{t('Aucune action enregistrée')}</div>}
      {history.map((h) => {
        const tone = TONE[h.action];
        return (
          <div key={h._id} className="flex gap-3">
            <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${tone === 'success' ? 'bg-[#d8f8ea] text-[#0f9f6e]' : 'bg-slate-100 text-slate-500'}`}>
              {tone === 'create' ? <Plus className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-800">{tr(h.description) || actionLabels[h.action] || h.action}</div>
              <div className="text-[12px] text-slate-400">{dateTimeLong(h.createdAt)}{h.user_name ? t(' • par {user}', { user: h.user_name }) : ''}</div>
            </div>
          </div>
        );
      })}
    </div>
  </section>
  );
};
