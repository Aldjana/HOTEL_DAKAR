import { BadgeCheck, BedDouble, CircleAlert, CreditCard, FileCheck, Mail, Phone, ScrollText, Sparkles, Utensils, Wifi } from 'lucide-react';
import { fullName } from '../../../utils/format';
import { dateShort, moneyCFA, roomTypeName } from './DetailsFormat';
import { useT } from '../../../i18n';

// Textes et icônes de la checklist d'origine
const CHECKIN_STEPS = [
  { id: 'id', title: 'Identité vérifiée', text: 'Scanner le passeport ou la CNI du client', Icon: FileCheck },
  { id: 'pay', title: 'Paiement vérifié', text: 'Garantie bancaire ou solde complet reçu', Icon: CreditCard },
  { id: 'room', title: 'Chambre prête', text: 'Statut ménage "Propre et Inspecté"', Icon: Sparkles },
  { id: 'terms', title: 'Conditions acceptées', text: 'Règlement intérieur signé numériquement', Icon: ScrollText },
];

const labelCls = 'text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400';

export const CheckInSummary = ({ r, rooms }) => {
  const { t } = useT();
  return (
  <section className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
    <div className="absolute right-0 top-0 h-1 w-1/3 rounded-bl-full bg-[#10B981]" />
    <h2 className="m-0 text-[28px] font-bold text-slate-900">{fullName(r.client_id)}</h2>
    <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-slate-500">
      <span className="inline-flex items-center gap-1.5"><Mail className="h-4 w-4" /> {r.client_id?.email || '—'}</span>
      <span className="inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {r.client_id?.phone || '—'}</span>
    </div>
    <div className="mt-8 grid grid-cols-3 gap-4 text-[13px]">
      <div>
        <div className={labelCls}>{t('Chambre')}</div>
        <div className="mt-1 font-semibold text-slate-800">{rooms.map((x) => x.room_number).join(', ') || '—'}</div>
        <div className="text-slate-400">{[...new Set(rooms.map(roomTypeName).filter(Boolean))].join(', ')}</div>
      </div>
      <div>
        <div className={labelCls}>{t('Dates')}</div>
        <div className="mt-1 font-semibold text-slate-800">{dateShort(r.arrival_date)} - {dateShort(r.departure_date)}</div>
        <div className="text-slate-400">{t(r.nights > 1 ? '{n} nuits' : '{n} nuit', { n: r.nights })}</div>
      </div>
      <div>
        <div className={labelCls}>{t('Nuits')}</div>
        <div className="mt-1 font-semibold text-slate-800">{r.nights}</div>
      </div>
    </div>
  </section>
  );
};

export const CheckInChecklist = ({ isDone, toggle }) => {
  const { t } = useT();
  return (
  <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
    <h3 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-slate-800">
      <span className="flex h-6 w-6 items-center justify-center rounded bg-[#e8f8f1] text-[#0f9f6e]">
        <BadgeCheck className="h-4 w-4" />
      </span>
      {t('Checklist Check-in')}
    </h3>
    <div className="space-y-3">
      {CHECKIN_STEPS.map(({ id, title, text, Icon }) => {
        const done = isDone(id);
        return (
          <div key={id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
            <button
              type="button"
              onClick={() => toggle(id)}
              className={`mt-0.5 flex h-5 w-5 cursor-pointer items-center justify-center rounded border p-0 ${done ? 'border-[#10B981] bg-[#10B981] text-white' : 'border-slate-300 bg-white text-slate-300'}`}
            >
              {done && <BadgeCheck className="h-3 w-3" />}
            </button>
            <div className="flex-1">
              <div className="text-[13px] font-semibold text-slate-800">{t(title)}</div>
              <div className="text-[12px] text-slate-500">{t(text)}</div>
            </div>
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${done ? 'bg-[#e8f8f1] text-[#0f9f6e]' : 'bg-slate-100 text-slate-400'}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>
        );
      })}
    </div>
  </section>
  );
};

export const CheckInPaymentCard = ({ r, canPay, onPay }) => {
  const { t } = useT();
  const balance = Math.max(r.balance_amount || 0, 0);
  return (
    <section className="overflow-hidden rounded-2xl bg-[#0D1520] p-5 text-white">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-slate-400">{t('Montant Total')}</span>
        <span className="font-bold">{moneyCFA(r.total_amount)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-[13px]">
        <span className="text-slate-400">{t('Déjà Payé')}</span>
        <span className="font-bold text-[#10B981]">{moneyCFA(r.paid_amount)}</span>
      </div>
      <div className="mt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#10B981]">{t('Reste à payer')}</div>
        <div className="mt-1 text-[32px] font-bold leading-none">{moneyCFA(balance)}</div>
      </div>
      {canPay && balance > 0 && (
        <button type="button" onClick={onPay} className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border-none bg-[#10B981] py-3 text-[13px] font-semibold text-[#0D1520]">
          <CreditCard className="h-4 w-4" /> {t('Enregistrer un paiement')}
        </button>
      )}
    </section>
  );
};

const amenityIcon = (label) => (/wifi|wi-fi/i.test(label) ? Wifi : /d[ée]jeuner|breakfast|repas|restaurant/i.test(label) ? Utensils : BedDouble);

export const CheckInRoomCard = ({ rooms }) => {
  const { t } = useT();
  const room = rooms[0];
  const items = rooms.flatMap((x) => (x.amenities || []).map((a) => (typeof a === 'string' ? a : a?.name))).filter(Boolean);
  const list = items.length ? items : [roomTypeName(room) ? `${roomTypeName(room)}${room?.floor != null ? ` • ${t('Étage {n}', { n: room.floor })}` : ''}` : '—'];
  const src = room?.images?.[0]?.url || room?.images?.[0] || room?.photo_url || 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=900&q=80';
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <img src={src} alt="" className="h-40 w-full object-cover" onError={(e) => { e.currentTarget.style.visibility = 'hidden'; }} />
      <div className="p-4">
        <h3 className="m-0 text-[14px] font-semibold text-slate-800">{t("Détails de l'hébergement")}</h3>
        <ul className="m-0 mt-3 list-none space-y-2 p-0 text-[13px] text-slate-500">
          {list.map((label) => {
            const Icon = amenityIcon(label);
            return <li key={label} className="flex items-center gap-2"><Icon className="h-4 w-4" /> {label}</li>;
          })}
        </ul>
      </div>
    </section>
  );
};

export const CheckInNote = ({ r }) => {
  const { t } = useT();
  const text = [r.special_requests, r.notes].filter(Boolean).join('\n');
  if (!text) return null;
  return (
    <section className="rounded-2xl border border-amber-100 bg-[#fff8ee] p-4">
      <div className="mb-1 flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-700">
        <CircleAlert className="h-4 w-4 text-amber-500" /> {t('Note de réservation')}
      </div>
      <p className="m-0 whitespace-pre-line text-[12px] leading-5 text-slate-500">{text}</p>
    </section>
  );
};
