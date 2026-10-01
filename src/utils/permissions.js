import { tr } from '../i18n';

// Miroir de backend/src/config/permissions.js. Le backend reste l'autorité : ceci ne sert qu'à
// masquer ce que l'utilisateur ne peut de toute façon pas faire.
export const PERMISSIONS = {
  'users.manage': ['admin'],
  'settings.read': ['admin', 'manager', 'reception', 'housekeeping'],
  'settings.update': ['admin', 'manager'],
  'rooms.read': ['admin', 'manager', 'reception', 'housekeeping'],
  'rooms.manage': ['admin', 'manager'],
  'clients.read': ['admin', 'manager', 'reception'],
  'clients.write': ['admin', 'manager', 'reception'],
  'clients.delete': ['admin', 'manager'],
  'reservations.read': ['admin', 'manager', 'reception'],
  'reservations.write': ['admin', 'manager', 'reception'],
  'reservations.price_override': ['admin', 'manager'],
  'payments.read': ['admin', 'manager', 'reception'],
  'payments.create': ['admin', 'manager', 'reception'],
  'payments.correct': ['admin', 'manager'],
  'payments.delete': ['admin', 'manager'],
  'invoices.read': ['admin', 'manager', 'reception'],
  'invoices.write': ['admin', 'manager', 'reception'],
  'cash.read': ['admin', 'manager', 'reception'],
  'cash.close': ['admin', 'manager'],
  'reports.read': ['admin', 'manager'],
  'exports.read': ['admin', 'manager'],
  'housekeeping.read': ['admin', 'manager', 'reception', 'housekeeping'],
  'housekeeping.write': ['admin', 'manager', 'reception', 'housekeeping'],
  'audit.read': ['admin', 'manager'],
  'dashboard.read': ['admin', 'manager', 'reception', 'housekeeping'],
  'planning.read': ['admin', 'manager', 'reception'],
};

export const can = (role, permission) => (PERMISSIONS[permission] || []).includes(role);

export const ROLE_LABELS = {
  get admin() { return tr('Administrateur'); },
  get manager() { return tr('Manager'); },
  get reception() { return tr('Réception'); },
  get housekeeping() { return tr('Ménage'); },
};

// Page d'accueil selon le rôle (le ménage ne voit ni finance ni réservations)
export const homeFor = (role) => (role === 'housekeeping' ? '/housekeeping' : '/');
