# API Backend - Système de Gestion Hôtelière

Backend API pour le système de gestion hôtelière (PMS) construit avec Node.js, Express et MongoDB.

## Stack Technique

- **Node.js** - Environnement d'exécution
- **Express** - Framework web
- **MongoDB** - Base de données
- **Mongoose** - ODM
- **JWT** - Authentification
- **Winston** - Logging
- **Joi** - Validation

## Structure du Projet

```
backend/
├── src/
│   ├── config/          # Fichiers de configuration
│   ├── controllers/     # Gestionnaires de requêtes
│   ├── middleware/      # Middleware personnalisés
│   ├── models/          # Modèles de base de données (Mongoose)
│   ├── routes/          # Routes API
│   ├── services/        # Logique métier
│   ├── utils/           # Fonctions utilitaires
│   ├── validators/      # Validateurs de requêtes
│   ├── app.js           # Configuration Express
│   └── server.js        # Point d'entrée du serveur
├── logs/                # Fichiers de logs
├── uploads/             # Fichiers uploadés
├── .env.example         # Modèle de variables d'environnement
├── .gitignore
├── package.json
└── README.md
```

## Installation

1. Installer les dépendances:
```bash
npm install
```

2. Copier les variables d'environnement:
```bash
cp .env.example .env
```

3. Configurer votre base de données MongoDB dans `.env`:
```env
MONGODB_URI=your_mongodb_connection_string
```

## Lancement de l'Application

### Développement
```bash
npm run dev
```

### Production
```bash
npm start
```

## Endpoints API

### Authentification
- `POST /api/v1/auth/register` - Inscrire un nouvel utilisateur
- `POST /api/v1/auth/login` - Connexion utilisateur
- `POST /api/v1/auth/refresh-token` - Rafraîchir le token d'accès
- `GET /api/v1/auth/me` - Obtenir l'utilisateur actuel

### Clients
- `POST /api/v1/clients` - Créer un nouveau client
- `GET /api/v1/clients` - Obtenir tous les clients (paginés)
- `GET /api/v1/clients/search` - Rechercher des clients
- `GET /api/v1/clients/:id` - Obtenir un client par ID
- `PUT /api/v1/clients/:id` - Mettre à jour un client
- `DELETE /api/v1/clients/:id` - Supprimer un client

### Réservations
- `POST /api/v1/reservations` - Créer une nouvelle réservation
- `GET /api/v1/reservations` - Obtenir toutes les réservations (paginées)
- `GET /api/v1/reservations/by-date` - Obtenir les réservations par date
- `GET /api/v1/reservations/:id` - Obtenir une réservation par ID
- `PUT /api/v1/reservations/:id` - Mettre à jour une réservation
- `POST /api/v1/reservations/:id/check-in` - Check-in d'une réservation
- `POST /api/v1/reservations/:id/check-out` - Check-out d'une réservation
- `POST /api/v1/reservations/:id/cancel` - Annuler une réservation

### Paiements
- `POST /api/v1/payments` - Créer un nouveau paiement
- `GET /api/v1/payments` - Obtenir tous les paiements (paginés)
- `GET /api/v1/payments/by-date-range` - Obtenir les paiements par plage de dates
- `GET /api/v1/payments/summary` - Obtenir le résumé des paiements
- `GET /api/v1/payments/:id` - Obtenir un paiement par ID
- `PUT /api/v1/payments/:id` - Mettre à jour un paiement
- `POST /api/v1/payments/:id/refund` - Rembourser un paiement

### Chambres
- `GET /api/v1/rooms` - Obtenir toutes les chambres (paginées)
- `GET /api/v1/rooms/available` - Obtenir les chambres disponibles
- `GET /api/v1/rooms/statistics` - Obtenir les statistiques des chambres
- `GET /api/v1/rooms/:id` - Obtenir une chambre par ID
- `POST /api/v1/rooms` - Créer une nouvelle chambre
- `PUT /api/v1/rooms/:id` - Mettre à jour une chambre
- `PATCH /api/v1/rooms/:id/status` - Mettre à jour le statut d'une chambre
- `DELETE /api/v1/rooms/:id` - Supprimer une chambre

### Factures
- `POST /api/v1/invoices` - Créer une nouvelle facture
- `GET /api/v1/invoices` - Obtenir toutes les factures (paginées)
- `GET /api/v1/invoices/:id` - Obtenir une facture par ID
- `PUT /api/v1/invoices/:id` - Mettre à jour une facture
- `DELETE /api/v1/invoices/:id` - Supprimer une facture
- `POST /api/v1/invoices/:id/send` - Envoyer une facture
- `POST /api/v1/invoices/:id/mark-paid` - Marquer une facture comme payée

### Ménage
- `POST /api/v1/housekeeping` - Créer une nouvelle tâche
- `GET /api/v1/housekeeping` - Obtenir toutes les tâches (paginées)
- `GET /api/v1/housekeeping/by-date` - Obtenir les tâches par date
- `GET /api/v1/housekeeping/statistics` - Obtenir les statistiques des tâches
- `GET /api/v1/housekeeping/:id` - Obtenir une tâche par ID
- `PUT /api/v1/housekeeping/:id` - Mettre à jour une tâche
- `POST /api/v1/housekeeping/:id/complete` - Marquer une tâche comme terminée
- `POST /api/v1/housekeeping/:id/assign` - Assigner une tâche à un utilisateur
- `DELETE /api/v1/housekeeping/:id` - Supprimer une tâche

### Types de Chambres
- `POST /api/v1/room-types` - Créer un nouveau type de chambre
- `GET /api/v1/room-types` - Obtenir tous les types de chambres (paginés)
- `GET /api/v1/room-types/:id` - Obtenir un type de chambre par ID
- `PUT /api/v1/room-types/:id` - Mettre à jour un type de chambre
- `DELETE /api/v1/room-types/:id` - Supprimer un type de chambre

### Modes de Paiement
- `POST /api/v1/payment-modes` - Créer un nouveau mode de paiement
- `GET /api/v1/payment-modes` - Obtenir tous les modes de paiement (paginés)
- `GET /api/v1/payment-modes/:id` - Obtenir un mode de paiement par ID
- `PUT /api/v1/payment-modes/:id` - Mettre à jour un mode de paiement
- `DELETE /api/v1/payment-modes/:id` - Supprimer un mode de paiement

### Sources de Réservation
- `POST /api/v1/reservation-sources` - Créer une nouvelle source de réservation
- `GET /api/v1/reservation-sources` - Obtenir toutes les sources de réservation (paginées)
- `GET /api/v1/reservation-sources/:id` - Obtenir une source de réservation par ID
- `PUT /api/v1/reservation-sources/:id` - Mettre à jour une source de réservation
- `DELETE /api/v1/reservation-sources/:id` - Supprimer une source de réservation

### Documents
- `POST /api/v1/documents` - Créer un nouveau document
- `GET /api/v1/documents` - Obtenir tous les documents (paginés)
- `GET /api/v1/documents/:id` - Obtenir un document par ID
- `PUT /api/v1/documents/:id` - Mettre à jour un document
- `DELETE /api/v1/documents/:id` - Supprimer un document
- `GET /api/v1/documents/reservation/:reservationId` - Obtenir les documents d'une réservation

### Historiques
- `POST /api/v1/history-logs` - Créer un nouvel historique
- `GET /api/v1/history-logs` - Obtenir tous les historiques (paginés)
- `GET /api/v1/history-logs/:id` - Obtenir un historique par ID
- `DELETE /api/v1/history-logs/:id` - Supprimer un historique
- `GET /api/v1/history-logs/entity/:entityType/:entityId` - Obtenir les historiques d'une entité
- `GET /api/v1/history-logs/user/:userId` - Obtenir les historiques d'un utilisateur

### Tableau de Bord
- `GET /api/v1/dashboard/statistics` - Obtenir les statistiques du tableau de bord (occupation, réservations, clients, disponibilités, revenus)
- `GET /api/v1/dashboard/availability-calendar?startDate=&endDate=` - Obtenir le calendrier de disponibilités en temps réel

## Authentification

La plupart des endpoints nécessitent une authentification via token JWT. Incluez le token dans l'en-tête Authorization:

```
Authorization: Bearer <votre_token>
```

## Format des Réponses

Toutes les réponses suivent ce format:

**Réponse de Succès:**
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": { ... }
}
```

**Réponse d'Erreur:**
```json
{
  "success": false,
  "message": "Message d'erreur",
  "errors": [ ... ]
}
```

**Réponse Paginée:**
```json
{
  "success": true,
  "message": "Opération réussie",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

## Variables d'Environnement

Voir `.env.example` pour toutes les variables d'environnement disponibles.

## Base de Données

L'application utilise MongoDB avec Mongoose. Les collections sont automatiquement créées lors de la première utilisation.

## Logging

Les logs sont stockés dans le répertoire `logs/`:
- `error.log` - Logs d'erreurs
- `app.log` - Logs de l'application

## Sécurité

- Helmet pour la sécurité des en-têtes HTTP
- CORS configuré pour l'origine du frontend
- Rate limiting pour prévenir les abus
- Authentification JWT
- Validation des entrées avec express-validator
- Hashage des mots de passe avec bcrypt

## Développement

Le serveur tourne sur le port 3000 par défaut. Changez cela dans le fichier `.env`.

## Licence

MIT
