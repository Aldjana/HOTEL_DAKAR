// Réinitialisation de l'activité (données de test) : npm run reset
// Efface réservations, clients, paiements, factures, caisse, ménage, documents, historique et compteurs.
// Conserve utilisateurs, chambres, types de chambres, modes de paiement, sources et paramètres de l'hôtel.
// Une sauvegarde complète est faite AVANT tout effacement (backups/avant-reset-<horodatage>/).
require('dotenv').config();
const path = require('path');
const readline = require('readline');
const { execFileSync } = require('child_process');
const mongoose = require('mongoose');

const CLEARED = ['reservations', 'clients', 'payments', 'invoices', 'invoice_items', 'cash_closures', 'housekeeping_tasks', 'documents', 'history_logs', 'counters'];
// Statuts liés à l'activité : la chambre redevient disponible. Maintenance / bloquée / hors service sont conservés.
const ACTIVITY_ROOM_STATUSES = ['reserved', 'occupied', 'cleaning', 'clean'];
const CONFIRM_WORD = 'REINITIALISER';

const ask = (q) => new Promise((resolve) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(q, (a) => { rl.close(); resolve(a.trim()); });
});

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI manquant (fichier backend/.env)');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  const { host } = mongoose.connection;

  console.log(`\nBase : ${db.databaseName} sur ${host}\n\nSeront EFFACÉS :`);
  for (const name of CLEARED) console.log(`  - ${name.padEnd(20)} ${await db.collection(name).countDocuments()} document(s)`);
  const rooms = await db.collection('rooms').countDocuments({ status: { $in: ACTIVITY_ROOM_STATUSES } });
  console.log(`\nChambres remises « disponible » : ${rooms}`);
  console.log('Conservés : utilisateurs, chambres, types de chambres, modes de paiement, sources, paramètres.\n');

  const answer = await ask(`Tapez ${CONFIRM_WORD} pour confirmer (toute autre réponse annule) : `);
  if (answer !== CONFIRM_WORD) {
    console.log('Annulé : rien n\'a été modifié.');
    await mongoose.disconnect();
    return;
  }

  // Sauvegarde complète d'abord : si elle échoue, execFileSync lève une erreur et rien n'est effacé.
  const dir = path.join(__dirname, '..', 'backups', `avant-reset-${new Date().toISOString().replace(/[:.]/g, '-')}`);
  console.log('\nSauvegarde avant réinitialisation…');
  execFileSync(process.execPath, [path.join(__dirname, 'backup.js'), 'backup', dir], { stdio: 'inherit' });

  for (const name of CLEARED) {
    const { deletedCount } = await db.collection(name).deleteMany({});
    console.log(`✓ ${name} : ${deletedCount} supprimé(s)`);
  }
  const { modifiedCount } = await db.collection('rooms').updateMany({ status: { $in: ACTIVITY_ROOM_STATUSES } }, { $set: { status: 'available' } });
  console.log(`✓ rooms : ${modifiedCount} chambre(s) remise(s) « disponible »`);

  console.log(`\nRéinitialisation terminée. Pour revenir en arrière : npm run restore -- "${dir}"`);
  await mongoose.disconnect();
})().catch(async (e) => {
  console.error('✗', e.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
