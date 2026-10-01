// Formatage FCFA / dates. Les dates de séjour sont des dates calendaires (UTC minuit) : on les lit en UTC
// pour éviter tout décalage d'un jour selon le fuseau du navigateur.
import { getLocale } from '../i18n';

const nf = { format: (n) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 0 }).format(n) };

export const formatMoney = (amount, currency = 'FCFA') => `${nf.format(Math.round(Number(amount) || 0)).replace(/[  ]/g, ' ')} ${currency}`;

export const formatNumber = (n) => nf.format(Number(n) || 0).replace(/[  ]/g, ' ');

const pad = (n) => String(n).padStart(2, '0');
export const formatDay = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return `${pad(x.getUTCDate())}/${pad(x.getUTCMonth() + 1)}/${x.getUTCFullYear()}`;
};
export const formatDayLong = (d) => (d ? new Date(d).toLocaleDateString(getLocale(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
export const formatDayShort = (d) => (d ? new Date(d).toLocaleDateString(getLocale(), { weekday: 'short', day: '2-digit', month: '2-digit', timeZone: 'UTC' }) : '');
export const formatDateTimeLocal = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return '—';
  return `${pad(x.getDate())}/${pad(x.getMonth() + 1)}/${x.getFullYear()} ${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

// yyyy-mm-dd (jour civil) pour les <input type="date"> et les paramètres d'API
export const toInputDate = (d = new Date()) => {
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
export const todayStr = () => toInputDate(new Date());
export const addDaysStr = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};
export const nightsBetween = (a, b) => (a && b ? Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000) : 0);

export const fullName = (c) => (c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : '');
export const initials = (c) => `${(c?.first_name || '?')[0]}${(c?.last_name || '')[0] || ''}`.toUpperCase();
