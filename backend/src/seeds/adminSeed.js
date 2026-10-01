require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('../models');
const { hashPassword } = require('../utils/helpers');
const { ensureDefaults } = require('../services/defaultsService');

// Crée l'administrateur initial et les données de référence. Identifiants configurables :
//   ADMIN_EMAIL (défaut admin@hotel.com) / ADMIN_PASSWORD (défaut admin123 — À CHANGER en production)
const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    await ensureDefaults();
    const email = (process.env.ADMIN_EMAIL || 'admin@hotel.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`✓ Administrateur déjà présent : ${email}`);
    } else {
      await User.create({ first_name: 'Admin', last_name: 'Hôtel', email, password_hash: await hashPassword(password), role: 'admin', is_active: true });
      console.log(`✓ Administrateur créé : ${email} / ${password}`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('✗ Erreur du seed :', e.message);
    process.exit(1);
  }
};
run();
