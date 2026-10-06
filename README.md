# Hotel PMS — MVP Easy Hotel

Application de gestion hôtelière conforme au cahier des charges fonctionnel « MVP Easy Hotel » (03-07-2026).

- **Frontend** : React 19 + Vite + Tailwind (dossier `src/`)
- **Backend** : Node 22, Express, Mongoose/MongoDB, JWT (dossier `backend/`, API sous `/api/v1`)

## Démarrage

```bash
# Backend
cd backend
cp .env.example .env        # renseigner MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN
npm install
npm run seed                # crée l'administrateur (ADMIN_EMAIL / ADMIN_PASSWORD, défaut admin@hotel.com / admin123 — à changer)
npm run dev                 # http://localhost:3000/api/v1

# Frontend (racine du projet)
cp .env.example .env        # VITE_API_BASE_URL=http://localhost:3000/api/v1
npm install
npm run dev                 # http://localhost:5173
```

Au premier démarrage, le serveur crée les données de référence : modes de paiement (espèces, Wave, Orange Money, Free Money, carte bancaire, virement, chèque, OTA), sources de réservation, types de chambre et paramètres de l'hôtel.

## Rôles

| Rôle | Accès |
|---|---|
| Administrateur | Tout, dont utilisateurs, modes de paiement, sources |
| Manager | Tout sauf gestion des utilisateurs ; rapports, exports, corrections/annulations de paiements, tarif manuel, clôture de caisse |
| Réception | Réservations, clients, paiements (création), factures, caisse (lecture), planning, ménage |
| Ménage | Chambres (statut) et tâches de ménage uniquement |

La matrice est définie dans `backend/src/config/permissions.js` (autorité) et reflétée dans `src/utils/permissions.js` (affichage).

## Règles métier principales

- Pas de chevauchement de réservations sur une même chambre (un départ et une arrivée le même jour sont autorisés).
- Tarifs, remises, TVA et taxe de séjour calculés côté serveur ; tarif manuel réservé admin/manager.
- Check-in refusé si la chambre est à nettoyer/occupée ou si l'arrivée est future (sauf autorisation) ; check-out refusé avec un solde impayé (sauf encaissement ou autorisation explicite), puis création automatique de la tâche de ménage et de la facture.
- Paiement : correction, annulation et remboursement avec motif obligatoire (admin/manager) ; clôture de caisse qui verrouille la journée.
- Une facture émise ne se supprime pas : elle s'annule. Un client ou une chambre avec historique est désactivé(e), pas supprimé(e).
- Authentification : access token (1 h) + refresh token (30 j) avec rotation ; déconnexion et changement de mot de passe révoquent les jetons.

## Tests

```bash
cd backend
MONGODB_URI=mongodb://127.0.0.1:27017/hotel_pms_test PORT=3100 node src/server.js &
BASE_URL=http://localhost:3100/api/v1 node --test tests/e2e.test.js
```

Sauvegarde / restauration : `npm run backup` et `npm run restore -- <dossier>` (dans `backend/`).
Réinitialiser l'activité (réservations, clients, paiements, factures…, en gardant utilisateurs, chambres et paramètres) : `npm run reset` (dans `backend/`) — sauvegarde automatique avant effacement, confirmation demandée.

Les anciens rapports d'audit et scripts de test obsolètes sont archivés dans `docs/archive/`.
