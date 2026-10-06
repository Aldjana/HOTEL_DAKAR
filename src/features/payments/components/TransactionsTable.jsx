import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, MoreVertical, Pencil, Receipt, RotateCcw } from 'lucide-react';
import { paymentMethodLabel, PAYMENT_STATUS_LABELS } from '../../../constants/status';
import { formatMoney, fullName } from '../../../utils/format';
import { useT } from '../../../i18n';
import { avatarColor, dayMonth, modeClass, timeOf } from './paymentsUi';

// Menu d'actions (icône ⋮ de la maquette). Positionné en fixed pour ne pas être coupé par le défilement horizontal du tableau.
const RowMenu = ({ items }) => {
  const { t } = useT();
  const [pos, setPos] = useState(null);
  const ref = useRef(null);
  useEffect(() => {
    if (!pos) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setPos(null); };
    const esc = (e) => e.key === 'Escape' && setPos(null);
    const hide = () => setPos(null);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', hide, true);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); window.removeEventListener('scroll', hide, true); };
  }, [pos]);
  return (
    <div ref={ref} className="inline-block">
      <button type="button" aria-label={t('Actions')} className="text-slate-400 hover:text-slate-700" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); setPos(pos ? null : { top: r.bottom + 4, right: window.innerWidth - r.right }); }}>
        <MoreVertical className="h-4 w-4" />
      </button>
      {pos && (
        <div className="fixed z-40 min-w-[170px] rounded-xl border border-slate-100 bg-white p-1 shadow-lg" style={{ top: pos.top, right: pos.right }}>
          {items.map((it) => (
            <button key={it.label} type="button" onClick={() => { setPos(null); it.onClick(); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-slate-50 ${it.danger ? 'text-[#dc3b4e]' : 'text-slate-700'}`}>
              <it.icon className="h-4 w-4" /> {t(it.label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const rowItems = (p, can, onReceipt, onAction) => {
  const refund = p.type === 'refund';
  const voided = p.payment_status === 'voided';
  return [
    { label: 'Reçu PDF', icon: Receipt, onClick: () => onReceipt(p) },
    !voided && !refund && can('payments.correct') && { label: 'Corriger', icon: Pencil, onClick: () => onAction('correct', p) },
    p.payment_status === 'completed' && !refund && can('payments.correct') && { label: 'Rembourser', icon: RotateCcw, onClick: () => onAction('refund', p) },
    !voided && can('payments.delete') && { label: 'Annuler', icon: Ban, danger: true, onClick: () => onAction('void', p) },
  ].filter(Boolean);
};

const Badges = ({ p, methods }) => {
  const { t } = useT();
  const refund = p.type === 'refund';
  return (
    <>
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${modeClass(p.payment_method)}`}>{paymentMethodLabel(p.payment_method, methods)}</span>
      {refund && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{t('Remboursement')}</span>}
      {p.payment_status !== 'completed' && !refund && <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{PAYMENT_STATUS_LABELS[p.payment_status] || p.payment_status}</span>}
    </>
  );
};

const amountClass = (p) => (p.type === 'refund' ? 'text-[#dc3b4e]' : p.payment_status === 'voided' ? 'text-slate-400 line-through' : '');

// Mobile : une carte par paiement (pas de colonnes coupées sur petit écran).
const TransactionCards = ({ rows, methods, can, onReceipt, onAction }) => {
  const { t } = useT();
  if (rows.length === 0) return <p className="py-8 text-center text-[13px] text-slate-400">{t('Aucun paiement trouvé')}</p>;
  return (
    <ul className="m-0 list-none divide-y divide-slate-100 p-0">
      {rows.map((p) => {
        const res = p.reservation_id;
        return (
          <li key={p._id} className="flex items-start justify-between gap-3 py-3 text-[13px]">
            <div className="min-w-0">
              <div className="truncate font-semibold text-slate-800">{fullName(res?.client_id) || '—'}</div>
              <div className="text-[12px] text-slate-400">
                {dayMonth(p.payment_date)} · {timeOf(p.payment_date)}
                {res && <> · <Link to={`/reservations/${res._id}`} className="text-inherit">{res.reservation_number}</Link></>}
              </div>
              <div className="mt-1.5"><Badges p={p} methods={methods} /></div>
            </div>
            <div className="flex shrink-0 items-start gap-2">
              <span className={`whitespace-nowrap font-bold ${amountClass(p)}`}>{p.type === 'refund' ? '−' : ''}{formatMoney(p.amount)}</span>
              <RowMenu items={rowItems(p, can, onReceipt, onAction)} />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

const TransactionsTable = ({ rows, methods, can, onReceipt, onAction }) => {
  const { t } = useT();
  return (
    <>
    <div className="md:hidden"><TransactionCards rows={rows} methods={methods} can={can} onReceipt={onReceipt} onAction={onAction} /></div>
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[800px] text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
            <th className="py-2 font-semibold">{t('Date')}</th>
            <th className="py-2 font-semibold">{t('Réservation')}</th>
            <th className="py-2 font-semibold">{t('Client')}</th>
            <th className="py-2 font-semibold">{t('Montant')}</th>
            <th className="py-2 font-semibold">{t('Mode')}</th>
            <th className="py-2 font-semibold">{t('Référence')}</th>
            <th className="py-2 font-semibold">{t('Enregistré par')}</th>
            <th className="py-2 font-semibold">{t('Action')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && <tr className="border-t border-slate-100"><td colSpan={8} className="py-8 text-center text-slate-400">{t('Aucun paiement trouvé')}</td></tr>}
          {rows.map((p) => {
            const refund = p.type === 'refund';
            const res = p.reservation_id;
            const user = p.processed_by;
            const items = rowItems(p, can, onReceipt, onAction);
            return (
              <tr key={p._id} className="border-t border-slate-100">
                <td className="py-3"><div>{dayMonth(p.payment_date)}</div><div className="text-[12px] text-slate-400">{timeOf(p.payment_date)}</div></td>
                <td className="py-3 font-semibold">{res ? <Link to={`/reservations/${res._id}`} className="text-inherit no-underline hover:underline">{res.reservation_number}</Link> : '—'}</td>
                <td className="py-3">{fullName(res?.client_id) || '—'}</td>
                <td className={`py-3 font-bold ${amountClass(p)}`}>{refund ? '−' : ''}{formatMoney(p.amount)}</td>
                <td className="py-3"><Badges p={p} methods={methods} /></td>
                <td className="py-3 text-slate-400">{p.reference || p.receipt_number || p.transaction_id || '—'}</td>
                <td className="py-3">
                  {user ? (
                    <span className="inline-flex items-center gap-2">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white ${avatarColor(user._id)}`}>{(user.first_name || '?').slice(0, 2).toUpperCase()}</span>
                      {user.first_name}
                    </span>
                  ) : '—'}
                </td>
                <td className="py-3 text-slate-400"><RowMenu items={items} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    </>
  );
};

export default TransactionsTable;
