const { PaymentMode, ReservationSource, RoomType, HotelSettings } = require('../models');

const DEFAULT_PAYMENT_MODES = [
  { code: 'cash', name: 'Espèces', requires_reference: false },
  { code: 'wave', name: 'Wave', requires_reference: false },
  { code: 'orange_money', name: 'Orange Money', requires_reference: false },
  { code: 'free_money', name: 'Free Money', requires_reference: false },
  { code: 'credit_card', name: 'Carte bancaire', requires_reference: false },
  { code: 'bank_transfer', name: 'Virement', requires_reference: true },
  { code: 'check', name: 'Chèque', requires_reference: true },
  { code: 'ota', name: 'OTA (Booking, Airbnb…)', requires_reference: false },
  { code: 'other', name: 'Autre', requires_reference: false },
];

const DEFAULT_SOURCES = [
  { code: 'direct', name: 'Appel direct' },
  { code: 'whatsapp', name: 'WhatsApp' },
  { code: 'walk_in', name: 'Walk-in' },
  { code: 'email', name: 'Email' },
  { code: 'booking.com', name: 'Booking' },
  { code: 'airbnb', name: 'Airbnb' },
  { code: 'agency', name: 'Agence' },
  { code: 'company', name: 'Entreprise' },
  { code: 'website', name: 'Site web' },
  { code: 'other', name: 'Autre' },
];

const DEFAULT_ROOM_TYPES = [
  { code: 'standard', name: 'Standard', base_price: 25000, capacity_adults: 2, capacity_children: 1 },
  { code: 'double', name: 'Double', base_price: 35000, capacity_adults: 2, capacity_children: 2 },
  { code: 'suite', name: 'Suite', base_price: 65000, capacity_adults: 3, capacity_children: 2 },
  { code: 'studio', name: 'Studio', base_price: 30000, capacity_adults: 2, capacity_children: 1 },
  { code: 'apartment', name: 'Appartement', base_price: 80000, capacity_adults: 4, capacity_children: 2 },
  { code: 'bungalow', name: 'Bungalow', base_price: 55000, capacity_adults: 3, capacity_children: 2 },
  { code: 'villa', name: 'Villa', base_price: 120000, capacity_adults: 6, capacity_children: 3 },
  { code: 'dormitory', name: 'Dortoir', base_price: 10000, capacity_adults: 8, capacity_children: 0 },
  { code: 'other', name: 'Autre', base_price: 25000, capacity_adults: 2, capacity_children: 1 },
];

// Données de référence indispensables au fonctionnement (idempotent, ne touche pas aux données existantes).
const ensureDefaults = async () => {
  for (const m of DEFAULT_PAYMENT_MODES) {
    await PaymentMode.updateOne({ code: m.code }, { $setOnInsert: { ...m, is_active: true } }, { upsert: true });
  }
  for (const s of DEFAULT_SOURCES) {
    await ReservationSource.updateOne({ code: s.code }, { $setOnInsert: { ...s, is_active: true } }, { upsert: true });
  }
  if ((await RoomType.countDocuments()) === 0) {
    await RoomType.insertMany(DEFAULT_ROOM_TYPES.map((t) => ({ ...t, is_active: true })));
  }
  if (!(await HotelSettings.findOne())) await HotelSettings.create({});
};

module.exports = { ensureDefaults, DEFAULT_PAYMENT_MODES, DEFAULT_SOURCES, DEFAULT_ROOM_TYPES };
