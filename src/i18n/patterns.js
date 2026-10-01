// Messages du backend à valeurs interpolées : [RegExp sur le français, (match) => anglais].
// Les motifs sont ancrés (^...$) ; le premier qui correspond l'emporte.
const ROOM_ST = { available: 'available', reserved: 'reserved', occupied: 'occupied', cleaning: 'cleaning', clean: 'clean', maintenance: 'maintenance', blocked: 'blocked' };
const P = [
  [/^Valeur déjà utilisée pour « (.+) »$/, (m) => `Value already in use for "${m[1]}"`],
  [/^Route (.+) non trouvée$/, (m) => `Route ${m[1]} not found`],
  [/^Image trop volumineuse \(max (\d+) Mo\)$/, (m) => `Image too large (max ${m[1]} MB)`],
  [/^Envoi de l'image impossible : (.+)$/, (m) => `Unable to upload the image: ${m[1]}`],
  [/^Type d'export inconnu : (.+)$/, (m) => `Unknown export type: ${m[1]}`],

  // Chambres / disponibilité
  [/^La chambre (.+) est désactivée$/, (m) => `Room ${m[1]} is disabled`],
  [/^La chambre (.+) est indisponible \(en maintenance\)$/, (m) => `Room ${m[1]} is unavailable (under maintenance)`],
  [/^La chambre (.+) est indisponible \(bloquée\)$/, (m) => `Room ${m[1]} is unavailable (blocked)`],
  [/^La chambre (.+) est indisponible$/, (m) => `Room ${m[1]} is unavailable`],
  [/^Chambre indisponible sur cette période : déjà réservée par (.+)$/, (m) => `Room unavailable for this period: already booked by ${m[1].replace(/\(un client,/, '(a guest,')}`],
  [/^La chambre (.+) doit d'abord être nettoyée$/, (m) => `Room ${m[1]} must be cleaned first`],
  [/^La chambre (.+) est à nettoyer : elle doit être marquée propre avant le check-in$/, (m) => `Room ${m[1]} needs cleaning: it must be marked clean before check-in`],
  [/^La chambre (.+) est encore occupée \((.+)\)$/, (m) => `Room ${m[1]} is still occupied (${m[2]})`],
  [/^La chambre (.+) est occupée \((.+)\) : effectuez d'abord le check-out$/, (m) => `Room ${m[1]} is occupied (${m[2]}): perform the check-out first`],
  [/^Le numéro de chambre (.+) existe déjà$/, (m) => `Room number ${m[1]} already exists`],
  [/^Impossible de désactiver la chambre (.+) : (\d+) réservation\(s\) en cours ou à venir$/, (m) => `Cannot disable room ${m[1]}: ${m[2]} current or upcoming reservation(s)`],
  [/^Cette chambre a (\d+) réservation\(s\) : elle ne peut pas être supprimée\. Désactivez-la à la place\.$/, (m) => `This room has ${m[1]} reservation(s): it cannot be deleted. Disable it instead.`],
  [/^(\d+) réservation\(s\) à venir concernent cette chambre : pensez à changer de chambre\.$/, (m) => `${m[1]} upcoming reservation(s) involve this room: consider changing rooms.`],

  // Réservations
  [/^Source de réservation invalide : « (.+) »$/, (m) => `Invalid reservation source: "${m[1]}"`],
  [/^Capacité dépassée : (\d+) adulte\(s\) maximum pour la sélection$/, (m) => `Capacity exceeded: maximum ${m[1]} adult(s) for the selection`],
  [/^Capacité dépassée : (\d+) personne\(s\) maximum pour la sélection$/, (m) => `Capacity exceeded: maximum ${m[1]} person(s) for the selection`],
  [/^Check-in impossible : réservation annulée$/, () => 'Check-in not possible: reservation cancelled'],
  [/^Check-in impossible : réservation clôturée$/, () => 'Check-in not possible: reservation closed'],
  [/^Check-in impossible avant la date d'arrivée prévue \((.+)\)$/, (m) => `Check-in not possible before the scheduled arrival date (${m[1]})`],
  [/^Solde impayé : (.+) FCFA restent dus$/, (m) => `Unpaid balance: ${m[1]} FCFA still due`],

  // Clients
  [/^Un client avec le même email existe déjà : (.+)$/, (m) => `A client with the same email already exists: ${m[1]}`],
  [/^Un client avec le même téléphone existe déjà : (.+)$/, (m) => `A client with the same phone number already exists: ${m[1]}`],
  [/^Ce client a (\d+) réservation\(s\) : il a été désactivé \(historique conservé\)$/, (m) => `This client has ${m[1]} reservation(s): they have been disabled (history kept)`],

  // Caisse
  [/^La caisse du (.+) est clôturée : les paiements de cette journée ne peuvent plus être modifiés$/, (m) => `The cash register for ${m[1]} is closed: payments for this day can no longer be modified`],
  [/^La caisse du (.+) est déjà clôturée$/, (m) => `The cash register for ${m[1]} is already closed`],

  // Paiements / factures / références
  [/^Mode de paiement invalide ou désactivé : « (.+) »$/, (m) => `Invalid or disabled payment method: "${m[1]}"`],
  [/^Une référence est requise pour le mode « (.+) »$/, (m) => `A reference is required for the "${m[1]}" method`],
  [/^Le montant \((.+)\) dépasse le solde restant dû \((.+)\)$/, (m) => `The amount (${m[1]}) exceeds the remaining balance due (${m[2]})`],
  [/^Montant remboursable maximum : (.+)$/, (m) => `Maximum refundable amount: ${m[1]}`],
  [/^La facture (.+) existe déjà pour cette réservation\. Annulez-la pour en émettre une nouvelle\.$/, (m) => `Invoice ${m[1]} already exists for this reservation. Cancel it to issue a new one.`],
  [/^Une facture payée ne peut pas être marquée comme envoyée$/, () => 'A paid invoice cannot be marked as sent'],
  [/^Une facture annulée ne peut pas être marquée comme envoyée$/, () => 'A cancelled invoice cannot be marked as sent'],
  [/^Ce mode est utilisé par (\d+) paiement\(s\) : désactivez-le à la place$/, (m) => `This method is used by ${m[1]} payment(s): disable it instead`],
  [/^Cette source est utilisée par (\d+) réservation\(s\) : désactivez-la à la place$/, (m) => `This source is used by ${m[1]} reservation(s): disable it instead`],
  [/^Ce type est utilisé par (\d+) chambre\(s\) : désactivez-le à la place$/, (m) => `This type is used by ${m[1]} room(s): disable it instead`],

  // Housekeeping
  [/^Une tâche identique est déjà ouverte pour la chambre (.+)$/, (m) => `An identical task is already open for room ${m[1]}`],

  // Alertes du tableau de bord
  [/^Départ dépassé : (.+)$/, (m) => `Overdue departure: ${m[1]}`],
  [/^Arrivée non enregistrée : (.+) — attendue le (.+)$/, (m) => `Arrival not registered: ${m[1]} — expected on ${m[2]}`],
  [/^(\d+) chambre\(s\) à nettoyer$/, (m) => `${m[1]} room(s) to clean`],
  [/^(\d+) chambre\(s\) en maintenance$/, (m) => `${m[1]} room(s) under maintenance`],

  // Journal d'audit / historique (descriptions générées par le backend)
  [/^Création de la réservation (.+)$/, (m) => `Reservation ${m[1]} created`],
  [/^Modification de la réservation (.+)$/, (m) => `Reservation ${m[1]} updated`],
  [/^Changement de chambre de (.+)$/, (m) => `Room change for ${m[1]}`],
  [/^Check-in de (.+)$/, (m) => `Check-in of ${m[1]}`],
  [/^Check-out de (.+)$/, (m) => `Check-out of ${m[1]}`],
  [/^Annulation de (.+)$/, (m) => `Cancellation of ${m[1]}`],
  [/^No-show (.+)$/, (m) => `No-show ${m[1]}`],
  [/^Création du client (.+)$/, (m) => `Client ${m[1]} created`],
  [/^Modification du client (.+)$/, (m) => `Client ${m[1]} updated`],
  [/^Création de la chambre (.+)$/, (m) => `Room ${m[1]} created`],
  [/^Modification de la chambre (.+)$/, (m) => `Room ${m[1]} updated`],
  [/^Suppression de la chambre (.+)$/, (m) => `Room ${m[1]} deleted`],
  [/^Chambre (.+) : statut → (.+)$/, (m) => `Room ${m[1]}: status → ${ROOM_ST[m[2]] || m[2]}`],
  [/^Chambre (.+) activée$/, (m) => `Room ${m[1]} enabled`],
  [/^Chambre (.+) désactivée$/, (m) => `Room ${m[1]} disabled`],
  [/^Chambre (.+) \((.+)\) — (.+) au (.+)$/, (m) => `Room ${m[1]} (${m[2]}) — ${m[3]} to ${m[4]}`],
  [/^Chambre (.+) — (.+) au (.+)$/, (m) => `Room ${m[1]} — ${m[2]} to ${m[3]}`],
  [/^Paiement de (.+) \((.+)\) sur (.+)$/, (m) => `Payment of ${m[1]} (${m[2]}) on ${m[3]}`],
  [/^Correction du paiement (.+)$/, (m) => `Payment ${m[1]} corrected`],
  [/^Annulation du paiement (.+)$/, (m) => `Payment ${m[1]} voided`],
  [/^Remboursement de (.+)$/, (m) => `Refund of ${m[1]}`],
  [/^Règlement facture (.+)$/, (m) => `Payment of invoice ${m[1]}`],
  [/^Règlement de la facture (.+)$/, (m) => `Payment of invoice ${m[1]}`],
  [/^Facture (.+) marquée comme envoyée$/, (m) => `Invoice ${m[1]} marked as sent`],
  [/^Création du document (.+)$/, (m) => `Document ${m[1]} created`],
  [/^Modification du document (.+)$/, (m) => `Document ${m[1]} updated`],
  [/^Suppression du document (.+)$/, (m) => `Document ${m[1]} deleted`],
  [/^Clôture de caisse (.+)$/, (m) => `Cash register closing ${m[1]}`],
  [/^Réouverture de la caisse (.+)$/, (m) => `Cash register ${m[1]} reopened`],
  [/^Création de l'utilisateur (.+)$/, (m) => `User ${m[1]} created`],
  [/^Modification de l'utilisateur (.+)$/, (m) => `User ${m[1]} updated`],
  [/^Suppression de l'utilisateur (.+)$/, (m) => `User ${m[1]} deleted`],
  [/^Réinitialisation du mot de passe de (.+)$/, (m) => `Password reset for ${m[1]}`],
  [/^Connexion de (.+)$/, (m) => `Login of ${m[1]}`],
  [/^Déconnexion de (.+)$/, (m) => `Logout of ${m[1]}`],
  [/^Export (.+) \((.+)\)$/, (m) => `Export ${m[1]} (${m[2]})`],
  [/^Image envoyée \((.+)\) : (.+)$/, (m) => `Image uploaded (${m[1]}): ${m[2]}`],
  [/^Tâche ménage créée \(chambre (.+)\)$/, (m) => `Housekeeping task created (room ${m[1]})`],
  [/^Tâche ménage modifiée \(chambre (.+)\)$/, (m) => `Housekeeping task updated (room ${m[1]})`],
  [/^Nettoyage démarré \(chambre (.+)\)$/, (m) => `Cleaning started (room ${m[1]})`],
  [/^Nettoyage terminé \(chambre (.+)\)$/, (m) => `Cleaning completed (room ${m[1]})`],
  [/^Tâche assignée \(chambre (.+)\)$/, (m) => `Task assigned (room ${m[1]})`],
];

export default P;
// Retourne l'anglais du message dynamique, ou null si aucun motif ne correspond.
export const trPattern = (fr) => {
  if (typeof fr !== 'string') return null;
  for (const [re, fn] of P) { const m = fr.match(re); if (m) return fn(m); }
  return null;
};
