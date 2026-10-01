import { BedDouble, CalendarDays, CreditCard, FileText, KeyRound, LogOut, Receipt } from 'lucide-react';
import { CLIENT_TYPE_LABELS } from '../../../constants/status';
import { fullName } from '../../../utils/format';
import { dateLong, moneyFR } from './DetailsFormat';
import { tr, useT } from '../../../i18n';

const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400';

export const CheckOutClientCard = ({ r, rooms }) => {
  const { t } = useT();
  return (
  <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between">
      <div>
        <h2 className="m-0 text-[20px] font-bold text-slate-900">{fullName(r.client_id)}</h2>
        <div className="mt-1 text-[13px] text-slate-400">{r.client_id?.email || '—'}</div>
      </div>
      <span className="rounded-full bg-[#d8f8ea] px-3 py-1 text-[10px] font-bold uppercase text-[#0f9f6e]">{r.client_id?.is_vip ? t('Client VIP') : CLIENT_TYPE_LABELS[r.client_id?.client_type] || t('Client')}</span>
    </div>
    <div className="mt-6 grid grid-cols-3 gap-4 text-[13px]">
      <div>
        <div className={labelCls}>{t('Chambre')}</div>
        <div className="mt-1 inline-flex items-center gap-2 font-semibold"><BedDouble className="h-4 w-4" /> {rooms.map((x) => `${x.room_type_id?.name ? `${x.room_type_id.name} ` : ''}#${x.room_number}`).join(', ') || '—'}</div>
      </div>
      <div>
        <div className={labelCls}>{t('Arrivée')}</div>
        <div className="mt-1 inline-flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4" /> {dateLong(r.arrival_date)}</div>
      </div>
      <div>
        <div className={labelCls}>{t('Départ')}</div>
        <div className="mt-1 inline-flex items-center gap-2 font-semibold"><LogOut className="h-4 w-4" /> {dateLong(r.departure_date)}</div>
      </div>
    </div>
  </section>
  );
};

// Lignes de frais calculées depuis la réservation (nuitées par chambre, remise, taxes)
const feeLines = (r) => {
  const lines = [];
  if (r.rooms?.length) r.rooms.forEach((l) => lines.push({ label: tr('Nuitées (Chambre {n})', { n: l.room_number }), qty: r.nights, unit: l.nightly_rate, total: r.nights * l.nightly_rate }));
  else lines.push({ label: tr('Nuitées'), qty: r.nights, unit: r.nights ? r.subtotal_amount / r.nights : r.subtotal_amount, total: r.subtotal_amount });
  if (r.discount_amount > 0) lines.push({ label: r.discount_reason ? tr('Remise ({reason})', { reason: r.discount_reason }) : tr('Remise'), qty: 1, unit: -r.discount_amount, total: -r.discount_amount });
  if (r.apply_taxes !== false) {
    if (r.tax_amount > 0) lines.push({ label: tr('TVA'), qty: 1, unit: r.tax_amount, total: r.tax_amount });
    if (r.stay_tax_amount > 0) lines.push({ label: tr('Taxe de séjour'), qty: r.nights, unit: r.stay_tax_amount / (r.nights || 1), total: r.stay_tax_amount });
  }
  return lines;
};

export const CheckOutFeesCard = ({ r, canInvoice, hasInvoice, onInvoice, canReceipt, onReceipt, canDebt, debt, onDebt }) => {
  const { t } = useT();
  return (
  <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <h3 className="mb-3 mt-0 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t('Détails des frais')}</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="text-[11px] uppercase tracking-[0.1em] text-slate-400">
            <th className="pb-2 font-semibold">{t('Désignation')}</th>
            <th className="pb-2 font-semibold">{t('Quantité')}</th>
            <th className="pb-2 font-semibold">{t('Prix unitaire')}</th>
            <th className="pb-2 text-right font-semibold">{t('Total')}</th>
          </tr>
        </thead>
        <tbody>
          {feeLines(r).map((fee, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="py-3">{fee.label}</td>
              <td className="py-3 text-center">{fee.qty}</td>
              <td className="py-3 text-right">{moneyFR(fee.unit)}</td>
              <td className="py-3 text-right font-semibold">{moneyFR(fee.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {canInvoice && (
        <button type="button" onClick={onInvoice} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
          <FileText className="h-4 w-4" /> {hasInvoice ? t('Voir la facture') : t('Générer facture')}
        </button>
      )}
      {canReceipt && (
        <button type="button" onClick={onReceipt} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-[13px] font-semibold">
          <Receipt className="h-4 w-4" /> {t('Générer reçu')}
        </button>
      )}
      {canDebt && (
        <button type="button" onClick={onDebt} className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-[13px] font-semibold text-red-500 ${debt ? 'bg-red-50' : 'bg-white'}`}>
          {t('✕ Marquer comme créance')}
        </button>
      )}
    </div>
  </section>
  );
};

export const CheckOutFinanceCard = ({ r, balance, canPay, onPay }) => {
  const { t } = useT();
  return (
  <section className="rounded-2xl bg-[#0D1520] p-5 text-white">
    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">{t('Résumé financier')}</div>
    <div className="mt-4 space-y-2 text-[13px]">
      <div className="flex justify-between"><span className="text-slate-400">{t('Montant total')}</span><span>{moneyFR(r.total_amount)}</span></div>
      <div className="flex justify-between"><span className="text-slate-400">{t('Déjà payé')}</span><span>{moneyFR(r.paid_amount)}</span></div>
    </div>
    <div className="mt-5">
      <div className="text-right text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{t('À encaisser')}</div>
      <div className="text-right text-[32px] font-bold leading-none text-[#10B981]">{moneyFR(balance)}</div>
    </div>
    {canPay && balance > 0 && (
      <button type="button" onClick={onPay} className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#10B981] py-3 text-[13px] font-semibold text-[#0D1520]">
        <CreditCard className="h-4 w-4" /> {t('Enregistrer paiement final')}
      </button>
    )}
  </section>
  );
};

export const CheckOutRoomCard = ({ rooms, keys, setKeys, disabled, saving, onValidate, hint }) => {
  const { t } = useT();
  return (
  <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <div className="flex items-start gap-3">
      <KeyRound className="h-5 w-5 text-slate-400" />
      <div>
        <div className="font-semibold text-slate-800">{t('Statut de la chambre')}</div>
        <p className="m-0 mt-1 text-[12px] text-slate-500">
          {t(rooms.length > 1 ? 'Les chambres {rooms} seront marquées comme "Sale - À nettoyer" après validation.' : 'La chambre {rooms} sera marquée comme "Sale - À nettoyer" après validation.', { rooms: rooms.map((x) => `#${x.room_number}`).join(', ') })}
        </p>
      </div>
    </div>
    <label className="mt-4 flex items-center gap-2 text-[13px] text-slate-600">
      <input type="checkbox" checked={keys} onChange={(e) => setKeys(e.target.checked)} className="h-4 w-4" />
      {t('Clés/Cartes magnétiques restituées')}
    </label>
    <button
      type="button"
      disabled={disabled || saving}
      onClick={onValidate}
      className={`mt-4 w-full rounded-lg border-none py-3 text-[13px] font-semibold ${disabled || saving ? 'cursor-not-allowed bg-slate-200 text-slate-500' : 'cursor-pointer bg-[#0D1520] text-white'}`}
    >
      {saving ? t('Chargement...') : t('Valider le check-out')}
    </button>
    {hint && <p className="mb-0 mt-2 text-center text-[11px] text-slate-400">{hint}</p>}
  </section>
  );
};
