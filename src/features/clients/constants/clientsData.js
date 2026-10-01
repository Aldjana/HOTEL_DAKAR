import { tr } from '../../../i18n';

export const CLIENT_BADGE_CLASSES = {
  Particulier: 'bg-[#d8f8ea] text-[#0f9f6e]',
  Entreprise: 'bg-slate-100 text-slate-600',
  VIP: 'bg-[#fde9c8] text-[#c47a12]',
};

// Type affiché (Particulier / Entreprise / VIP) à partir du client API
export const clientBadge = (c) => {
  if (c.is_vip) return 'VIP';
  return ['company', 'agency', 'ngo'].includes(c.client_type) ? 'Entreprise' : 'Particulier';
};

export const CLIENT_AVATAR_COLORS = { VIP: 'bg-[#10B981]', Entreprise: 'bg-amber-500', Particulier: 'bg-slate-800' };

const MONTHS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
export const formatStayDate = (d) => {
  if (!d) return '—';
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '—' : `${String(x.getUTCDate()).padStart(2, '0')} ${tr(MONTHS[x.getUTCMonth()])} ${x.getUTCFullYear()}`;
};

export const clientInitials = (c) => `${(c.first_name || '?')[0]}${(c.last_name || '')[0] || ''}`.toUpperCase();

export const pageList = (page, total) => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (page <= 3) return [1, 2, 3, '...', total];
  if (page >= total - 2) return [1, '...', total - 2, total - 1, total];
  return [1, '...', page, '...', total];
};
