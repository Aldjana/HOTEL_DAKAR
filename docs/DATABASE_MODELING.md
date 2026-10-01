# Modélisation de Base de Données - Hotel PMS

## Vue d'ensemble
Ce document présente la modélisation de la base de données pour le système de gestion hôtelière (PMS - Property Management System).

## Entités Principales

### 1. Utilisateurs (Users)
**Description**: Personnel de l'hôtel avec accès au système

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `email` (VARCHAR, UNIQUE, NOT NULL)
- `password_hash` (VARCHAR, NOT NULL)
- `first_name` (VARCHAR, NOT NULL)
- `last_name` (VARCHAR, NOT NULL)
- `role` (ENUM: 'admin', 'reception', 'housekeeping', 'manager')
- `is_active` (BOOLEAN, DEFAULT: true)
- `avatar_url` (VARCHAR)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Un utilisateur peut créer plusieurs réservations
- Un utilisateur peut enregistrer plusieurs paiements

---

### 2. Clients
**Description**: Clients de l'hôtel

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `first_name` (VARCHAR, NOT NULL)
- `last_name` (VARCHAR, NOT NULL)
- `email` (VARCHAR, UNIQUE)
- `phone` (VARCHAR)
- `nationality` (VARCHAR)
- `id_document_type` (ENUM: 'passport', 'id_card', 'driver_license')
- `id_document_number` (VARCHAR)
- `is_vip` (BOOLEAN, DEFAULT: false)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Un client peut avoir plusieurs réservations
- Un client peut avoir plusieurs documents

---

### 3. Chambres (Rooms)
**Description**: Chambres de l'hôtel

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `room_number` (VARCHAR, UNIQUE, NOT NULL)
- `room_type_id` (UUID, FOREIGN KEY → room_types)
- `floor` (INTEGER)
- `status` (ENUM: 'available', 'occupied', 'cleaning', 'maintenance', 'out_of_order')
- `view` (ENUM: 'sea', 'garden', 'city', 'pool')
- `max_adults` (INTEGER, DEFAULT: 2)
- `max_children` (INTEGER, DEFAULT: 1)
- `base_price` (DECIMAL, NOT NULL)
- `amenities` (JSONB) - Liste des équipements
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Une chambre appartient à un type de chambre
- Une chambre peut avoir plusieurs réservations
- Une chambre peut avoir plusieurs tâches de ménage

---

### 4. Types de Chambres (Room Types)
**Description**: Catégories de chambres

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR, NOT NULL)
- `description` (TEXT)
- `base_price` (DECIMAL, NOT NULL)
- `capacity_adults` (INTEGER, DEFAULT: 2)
- `capacity_children` (INTEGER, DEFAULT: 1)
- `size_sqm` (INTEGER)
- `amenities` (JSONB)
- `is_active` (BOOLEAN, DEFAULT: true)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Un type de chambre peut avoir plusieurs chambres

---

### 5. Réservations (Reservations)
**Description**: Réservations de chambres

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `reservation_number` (VARCHAR, UNIQUE, NOT NULL)
- `client_id` (UUID, FOREIGN KEY → clients)
- `room_id` (UUID, FOREIGN KEY → rooms)
- `created_by` (UUID, FOREIGN KEY → users)
- `arrival_date` (DATE, NOT NULL)
- `departure_date` (DATE, NOT NULL)
- `adults_count` (INTEGER, DEFAULT: 1)
- `children_count` (INTEGER, DEFAULT: 0)
- `status` (ENUM: 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show')
- `rate_type` (ENUM: 'standard', 'weekend', 'holiday', 'promo')
- `total_amount` (DECIMAL, NOT NULL)
- `paid_amount` (DECIMAL, DEFAULT: 0)
- `balance_amount` (DECIMAL, DEFAULT: 0)
- `source` (ENUM: 'direct', 'booking.com', 'expedia', 'airbnb', 'agency', 'walk_in')
- `special_requests` (TEXT)
- `check_in_time` (TIMESTAMP)
- `check_out_time` (TIMESTAMP)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Une réservation appartient à un client
- Une réservation concerne une chambre
- Une réservation est créée par un utilisateur
- Une réservation peut avoir plusieurs paiements
- Une réservation peut avoir plusieurs factures
- Une réservation peut avoir plusieurs documents

---

### 6. Paiements (Payments)
**Description**: Paiements associés aux réservations

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `reservation_id` (UUID, FOREIGN KEY → reservations)
- `processed_by` (UUID, FOREIGN KEY → users)
- `transaction_id` (VARCHAR, UNIQUE)
- `amount` (DECIMAL, NOT NULL)
- `payment_method` (ENUM: 'cash', 'credit_card', 'debit_card', 'bank_transfer', 'check', 'mobile_money', 'wave', 'orange_money')
- `payment_status` (ENUM: 'pending', 'completed', 'failed', 'refunded')
- `payment_date` (TIMESTAMP, DEFAULT: NOW())
- `description` (TEXT)
- `reference` (VARCHAR)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Un paiement est associé à une réservation
- Un paiement est traité par un utilisateur

---

### 7. Factures (Invoices)
**Description**: Factures générées pour les réservations

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `invoice_number` (VARCHAR, UNIQUE, NOT NULL)
- `reservation_id` (UUID, FOREIGN KEY → reservations)
- `client_id` (UUID, FOREIGN KEY → clients)
- `issued_by` (UUID, FOREIGN KEY → users)
- `issue_date` (DATE, DEFAULT: CURRENT_DATE)
- `due_date` (DATE)
- `subtotal` (DECIMAL, NOT NULL)
- `tax_amount` (DECIMAL, DEFAULT: 0)
- `discount_amount` (DECIMAL, DEFAULT: 0)
- `total_amount` (DECIMAL, NOT NULL)
- `paid_amount` (DECIMAL, DEFAULT: 0)
- `status` (ENUM: 'draft', 'sent', 'paid', 'overdue', 'cancelled')
- `notes` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Une facture est liée à une réservation
- Une facture est liée à un client
- Une facture est émise par un utilisateur
- Une facture peut avoir plusieurs lignes de facture

---

### 8. Lignes de Facture (Invoice Items)
**Description**: Détails des factures

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `invoice_id` (UUID, FOREIGN KEY → invoices)
- `description` (VARCHAR, NOT NULL)
- `quantity` (INTEGER, DEFAULT: 1)
- `unit_price` (DECIMAL, NOT NULL)
- `total_price` (DECIMAL, NOT NULL)
- `item_type` (ENUM: 'room', 'service', 'extra', 'penalty', 'discount')
- `created_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Une ligne de facture appartient à une facture

---

### 9. Tâches de Ménage (Housekeeping Tasks)
**Description**: Tâches de nettoyage et maintenance

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `room_id` (UUID, FOREIGN KEY → rooms)
- `assigned_to` (UUID, FOREIGN KEY → users)
- `task_type` (ENUM: 'cleaning', 'maintenance', 'inspection', 'deep_clean')
- `priority` (ENUM: 'low', 'medium', 'high', 'urgent')
- `status` (ENUM: 'pending', 'in_progress', 'completed', 'skipped')
- `scheduled_date` (DATE)
- `completed_at` (TIMESTAMP)
- `notes` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Une tâche est associée à une chambre
- Une tâche est assignée à un utilisateur

---

### 10. Documents (Documents)
**Description**: Documents attachés aux réservations

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `reservation_id` (UUID, FOREIGN KEY → reservations)
- `document_type` (ENUM: 'id_card', 'passport', 'contract', 'invoice', 'receipt', 'other')
- `file_name` (VARCHAR, NOT NULL)
- `file_url` (VARCHAR, NOT NULL)
- `file_size` (INTEGER)
- `mime_type` (VARCHAR)
- `uploaded_by` (UUID, FOREIGN KEY → users)
- `created_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Un document est lié à une réservation
- Un document est uploadé par un utilisateur

---

### 11. Modes de Paiement (Payment Modes)
**Description**: Configuration des modes de paiement acceptés

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR, NOT NULL)
- `code` (VARCHAR, UNIQUE, NOT NULL)
- `is_active` (BOOLEAN, DEFAULT: true)
- `requires_reference` (BOOLEAN, DEFAULT: false)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

---

### 12. Sources de Réservation (Reservation Sources)
**Description**: Canaux de réservation

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `name` (VARCHAR, NOT NULL)
- `code` (VARCHAR, UNIQUE, NOT NULL)
- `commission_rate` (DECIMAL, DEFAULT: 0)
- `is_active` (BOOLEAN, DEFAULT: true)
- `created_at` (TIMESTAMP, DEFAULT: NOW())
- `updated_at` (TIMESTAMP, DEFAULT: NOW())

---

### 13. Historique (History Logs)
**Description**: Journal des actions sur le système

**Attributs**:
- `id` (UUID, PRIMARY KEY)
- `user_id` (UUID, FOREIGN KEY → users)
- `entity_type` (VARCHAR, NOT NULL)
- `entity_id` (UUID, NOT NULL)
- `action` (ENUM: 'create', 'update', 'delete', 'check_in', 'check_out')
- `description` (TEXT)
- `ip_address` (VARCHAR)
- `created_at` (TIMESTAMP, DEFAULT: NOW())

**Relations**:
- Un historique est créé par un utilisateur

---

## Relations et Clés Étrangères

```sql
-- Clients
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

-- Chambres
ALTER TABLE rooms ADD CONSTRAINT fk_rooms_room_type 
  FOREIGN KEY (room_type_id) REFERENCES room_types(id) ON DELETE RESTRICT;

-- Réservations
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_room 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT;
ALTER TABLE reservations ADD CONSTRAINT fk_reservations_created_by 
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Paiements
ALTER TABLE payments ADD CONSTRAINT fk_payments_reservation 
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE payments ADD CONSTRAINT fk_payments_processed_by 
  FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL;

-- Factures
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_reservation 
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_client 
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
ALTER TABLE invoices ADD CONSTRAINT fk_invoices_issued_by 
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL;

-- Lignes de facture
ALTER TABLE invoice_items ADD CONSTRAINT fk_invoice_items_invoice 
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

-- Tâches de ménage
ALTER TABLE housekeeping_tasks ADD CONSTRAINT fk_housekeeping_tasks_room 
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT;
ALTER TABLE housekeeping_tasks ADD CONSTRAINT fk_housekeeping_tasks_assigned_to 
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- Documents
ALTER TABLE documents ADD CONSTRAINT fk_documents_reservation 
  FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE;
ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by 
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Historique
ALTER TABLE history_logs ADD CONSTRAINT fk_history_logs_user 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
```

## Indexes Recommandés

```sql
-- Pour les recherches fréquentes
CREATE INDEX idx_reservations_client_id ON reservations(client_id);
CREATE INDEX idx_reservations_room_id ON reservations(room_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_arrival_date ON reservations(arrival_date);
CREATE INDEX idx_reservations_departure_date ON reservations(departure_date);

CREATE INDEX idx_payments_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payments_status ON payments(payment_status);
CREATE INDEX idx_payments_date ON payments(payment_date);

CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_room_type_id ON rooms(room_type_id);

CREATE INDEX idx_housekeeping_tasks_room_id ON housekeeping_tasks(room_id);
CREATE INDEX idx_housekeeping_tasks_status ON housekeeping_tasks(status);
CREATE INDEX idx_housekeeping_tasks_assigned_to ON housekeeping_tasks(assigned_to);

CREATE INDEX idx_history_logs_entity ON history_logs(entity_type, entity_id);
CREATE INDEX idx_history_logs_created_at ON history_logs(created_at);
```

## Notes Importantes

1. **Dates et Heures**: Utiliser UTC pour le stockage et convertir au fuseau horaire local à l'affichage
2. **Montants**: Stocker en FCFA avec 2 décimales (DECIMAL(15,2))
3. **UUID**: Utiliser UUID v4 pour les identifiants primaires
4. **Soft Delete**: Pour certaines entités (clients, utilisateurs), envisager un soft delete avec un champ `deleted_at`
5. **Audit Trail**: La table `history_logs` permet de tracer toutes les modifications
6. **JSONB**: Utiliser pour les données flexibles comme les équipements et les préférences

## Prochaines Étapes

1. Valider le schéma avec l'équipe
2. Créer les scripts de migration
3. Définir les vues (views) pour les rapports
4. Créer les stored procedures pour les opérations complexes
5. Configurer les triggers pour l'audit automatique
