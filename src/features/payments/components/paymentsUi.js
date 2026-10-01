import { getLang, getLocale } from '../../../i18n';

// Styles d'affichage des modes de paiement (repris de la maquette d'origine).
const MODE_STYLES = {
  cash: 'bg-[#d8f8ea] text-[#0f9f6e]',
  wave: 'bg-[#fde9c8] text-[#c47a12]',
  credit_card: 'bg-[#d9ecfb] text-[#2b6cb0]',
  debit_card: 'bg-[#d9ecfb] text-[#2b6cb0]',
  orange_money: 'bg-[#fde4e4] text-[#dc3b4e]',
};
export const modeClass = (code) => MODE_STYLES[code] || 'bg-slate-100 text-slate-600';

const METHOD_CARDS = {
  cash: { icon: 'Wallet', bar: 'bg-slate-800 w-10' },
  wave: { icon: 'Radio', bar: 'bg-[#10B981] w-8' },
  orange_money: { icon: 'Smartphone', bar: 'bg-slate-700 w-7' },
  credit_card: { icon: 'CreditCard', bar: 'bg-amber-400 w-5' },
  debit_card: { icon: 'CreditCard', bar: 'bg-amber-400 w-5' },
};
export const methodCardStyle = (code) => METHOD_CARDS[code] || {};

// 450000 -> "450k"
export const formatShort = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) < 1000) return String(Math.round(v));
  const k = `${Math.round(v / 100) / 10}k`;
  return getLang() === 'en' ? k : k.replace('.', ',');
};

const AVATAR_COLORS = ['bg-slate-700', 'bg-[#10B981]'];
export const avatarColor = (id = '') => AVATAR_COLORS[[...String(id)].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

// "12 Mai" + "14:30" à partir d'un horodatage de paiement
export const dayMonth = (d) => {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  const s = x.toLocaleDateString(getLocale(), { day: 'numeric', month: 'short' }).replace('.', '');
  return s.replace(/ (.)/, (m, c) => ` ${c.toUpperCase()}`);
};
export const timeOf = (d) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '' : x.toLocaleTimeString(getLocale(), { hour: '2-digit', minute: '2-digit' });
};
