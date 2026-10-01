import { trc } from '../i18n';

// Les libellés restent écrits en français ; ils sont traduits à la lecture (selon la langue active).
const L = (o) => new Proxy(o, { get: (t, k) => (typeof t[k] === 'string' ? trc('status', t[k]) : t[k]) });
const opt = (value, label) => ({ value, get label() { return trc('status', label); } });

// Vocabulaire métier partagé. Les codes sont ceux de l'API ; les libellés suivent le cahier des charges.
export const RESERVATION_STATUS = { PENDING: 'pending', CONFIRMED: 'confirmed', CHECKED_IN: 'checked_in', CHECKED_OUT: 'checked_out', CANCELLED: 'cancelled', NO_SHOW: 'no_show' };
export const RESERVATION_STATUS_LABELS = L({ pending: 'En attente', confirmed: 'Confirmée', checked_in: 'Arrivée', checked_out: 'Parti', cancelled: 'Annulée', no_show: 'No-show' });
export const RESERVATION_STATUS_COLORS = { pending: 'warning', confirmed: 'success', checked_in: 'info', checked_out: 'neutral', cancelled: 'error', no_show: 'error' };

export const RESERVATION_PAYMENT_LABELS = L({ unpaid: 'Non payé', deposit: 'Avance reçue', partial: 'Partiellement payé', paid: 'Payé', refunded: 'Remboursé' });
export const RESERVATION_PAYMENT_COLORS = { unpaid: 'error', deposit: 'warning', partial: 'warning', paid: 'success', refunded: 'info' };

export const ROOM_STATUS = { AVAILABLE: 'available', RESERVED: 'reserved', OCCUPIED: 'occupied', CLEANING: 'cleaning', CLEAN: 'clean', MAINTENANCE: 'maintenance', BLOCKED: 'blocked' };
export const ROOM_STATUS_LABELS = L({ available: 'Disponible', reserved: 'Réservée', occupied: 'Occupée', cleaning: 'En nettoyage', clean: 'Propre', maintenance: 'Maintenance', blocked: 'Bloquée' });
export const ROOM_STATUS_COLORS = { available: 'success', reserved: 'info', occupied: 'error', cleaning: 'warning', clean: 'success', maintenance: 'purple', blocked: 'neutral' };
// Statuts qu'un utilisateur peut poser à la main (occupée/réservée sont déduits des réservations)
export const ROOM_MANUAL_STATUSES = ['available', 'clean', 'cleaning', 'maintenance', 'blocked'];

export const PAYMENT_STATUS_LABELS = L({ pending: 'En attente', completed: 'Réussi', failed: 'Échoué', refunded: 'Remboursé', voided: 'Annulé' });
export const PAYMENT_STATUS_COLORS = { pending: 'warning', completed: 'success', failed: 'error', refunded: 'info', voided: 'neutral' };

export const INVOICE_STATUS_LABELS = L({ draft: 'Brouillon', issued: 'Émise', sent: 'Envoyée', partially_paid: 'Partiellement payée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' });
export const INVOICE_STATUS_COLORS = { draft: 'neutral', issued: 'info', sent: 'info', partially_paid: 'warning', paid: 'success', overdue: 'error', cancelled: 'neutral' };

export const TASK_STATUS_LABELS = L({ pending: 'À faire', in_progress: 'En cours', completed: 'Terminée', skipped: 'Ignorée' });
export const TASK_TYPE_LABELS = L({ cleaning: 'Nettoyage', deep_clean: 'Nettoyage approfondi', inspection: 'Inspection', maintenance: 'Maintenance' });
export const PRIORITY_LABELS = L({ low: 'Basse', medium: 'Normale', high: 'Haute', urgent: 'Urgente' });
export const PRIORITY_COLORS = { low: 'neutral', medium: 'info', high: 'warning', urgent: 'error' };

export const CLIENT_TYPES = [
  opt('individual', 'Particulier'), opt('company', 'Entreprise'), opt('agency', 'Agence'),
  opt('ngo', 'ONG / Projet'), opt('diaspora', 'Diaspora'), opt('tourist', 'Touriste'),
  opt('local', 'Local'), opt('other', 'Autre'),
];
export const CLIENT_TYPE_LABELS = Object.fromEntries(CLIENT_TYPES.map((t) => [t.value, t.label]));

export const ID_DOCUMENT_TYPES = [
  opt('', '—'), opt('id_card', "Carte d'identité"), opt('passport', 'Passeport'),
  opt('driver_license', 'Permis de conduire'), opt('other', 'Autre'),
];

export const ROLE_OPTIONS = [
  opt('admin', 'Administrateur'), opt('manager', 'Manager'),
  opt('reception', 'Réception'), opt('housekeeping', 'Ménage'),
];

export const PAYMENT_METHOD_LABELS = L({
  cash: 'Espèces', wave: 'Wave', orange_money: 'Orange Money', free_money: 'Free Money', mobile_money: 'Mobile money',
  credit_card: 'Carte bancaire', debit_card: 'Carte de débit', bank_transfer: 'Virement', check: 'Chèque', ota: 'OTA', other: 'Autre',
});
export const paymentMethodLabel = (code, modes = []) => modes.find((m) => m.code === code)?.name || PAYMENT_METHOD_LABELS[code] || code;

export const AUDIT_ACTION_LABELS = L({
  login: 'Connexion', logout: 'Déconnexion', create: 'Création', update: 'Modification', delete: 'Suppression', check_in: 'Check-in', check_out: 'Check-out',
  cancel: 'Annulation', no_show: 'No-show', change_room: 'Changement de chambre', payment: 'Paiement', refund: 'Remboursement', void: 'Annulation paiement',
  export: 'Export', close_cash: 'Clôture caisse', reopen_cash: 'Réouverture caisse', status_change: 'Changement de statut',
});
