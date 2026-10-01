import { tr } from '../../../i18n';

export const ROOM_STATUS_BADGE = {
  available: { label: 'Disponible', className: 'bg-[#d8f8ea] text-[#0f9f6e]' },
  clean: { label: 'Propre', className: 'bg-[#d8f8ea] text-[#0f9f6e]' },
  occupied: { label: 'Occupée', className: 'bg-[#0D1520] text-white' },
  reserved: { label: 'Réservée', className: 'bg-slate-700 text-white' },
  cleaning: { label: 'En nettoyage', className: 'bg-slate-500 text-white' },
  maintenance: { label: 'Maintenance', className: 'bg-slate-500 text-white' },
  blocked: { label: 'Bloquée', className: 'bg-slate-500 text-white' },
};

// Images de la maquette (utilisées quand la chambre n'a pas d'image_url)
export const ROOM_FALLBACK_IMAGES = {
  available: 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80',
  occupied: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80',
  reserved: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
  maintenance: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
};

export const roomImage = (room) => room.image_url || ROOM_FALLBACK_IMAGES[room.status] || ROOM_FALLBACK_IMAGES[['clean', 'cleaning'].includes(room.status) ? 'available' : 'maintenance'];

const MONTHS = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];
export const shortDate = (d) => {
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? '—' : `${x.getUTCDate()} ${tr(MONTHS[x.getUTCMonth()])}.`;
};

export const roomInitials = (name = '') => name.split(' ').filter(Boolean).slice(0, 2).map((s) => s[0]).join('').toUpperCase() || '?';
