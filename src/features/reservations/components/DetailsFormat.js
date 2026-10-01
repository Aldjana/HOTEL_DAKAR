// Formats d'affichage repris de la maquette d'origine (montants et dates des écrans réservation).
import { getLocale, tr } from '../../../i18n';

const num = (v) => Math.round(Number(v) || 0);
export const moneyDE = (v) => `${num(v).toLocaleString(getLocale() === 'en-GB' ? 'en-GB' : 'de-DE')} FCFA`; // 450.000 FCFA (détails)
export const moneyFR = (v) => `${num(v).toLocaleString(getLocale())} FCFA`; // 510 000 FCFA (check-out)
export const moneyCFA = (v) => `${num(v).toLocaleString('en-US')} CFA`; // 245,000 CFA (check-in)

const cap = (s) => s.replace(/^(\d+\s)(\p{L})/u, (_, a, b) => a + b.toUpperCase());
const dayOpts = { day: '2-digit', month: 'short', timeZone: 'UTC' };
export const dateLong = (d) => (d ? cap(new Date(d).toLocaleDateString(getLocale(), { ...dayOpts, year: 'numeric' })) : '—');
export const dateShort = (d) => (d ? cap(new Date(d).toLocaleDateString(getLocale(), dayOpts)).replace(/\.$/, '') : '—');
const hm = (d) => {
  const x = new Date(d);
  return `${String(x.getHours()).padStart(2, '0')}:${String(x.getMinutes()).padStart(2, '0')}`;
};
export const dateTimeLong = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return `${cap(x.toLocaleDateString(getLocale(), { day: '2-digit', month: 'short', year: 'numeric' }))} ${hm(d)}`;
};

export const sourceLabel = (s) => ({ whatsapp: 'WhatsApp', phone: tr('Téléphone'), walk_in: tr('Sur place'), website: tr('Site web'), email: 'E-mail' }[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : ''));
export const rateLabel = (t) => (t ? tr('Tarif {type}', { type: `${t.charAt(0).toUpperCase()}${t.slice(1).replace(/_/g, ' ')}` }) : '');
export const roomList = (r) => (r?.room_details?.length ? r.room_details : [r?.room_id]).filter(Boolean);
export const roomTypeName = (rm) => rm?.room_type_id?.name || '';
