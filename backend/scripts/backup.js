// Sauvegarde logique de la base (CDC : sauvegarde des données). Usage : npm run backup [dossier]
// Écrit un fichier JSON par collection dans backups/<horodatage>/. Restauration : npm run restore <dossier>
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const mode = process.argv[2] === 'restore' ? 'restore' : 'backup';
const arg = process.argv[3];

(async () => {
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  const db = mongoose.connection.db;
  if (mode === 'backup') {
    const dir = path.resolve(arg || path.join(__dirname, '..', 'backups', new Date().toISOString().replace(/[:.]/g, '-')));
    fs.mkdirSync(dir, { recursive: true });
    const cols = await db.listCollections().toArray();
    for (const c of cols) {
      const docs = await db.collection(c.name).find({}).toArray();
      fs.writeFileSync(path.join(dir, `${c.name}.json`), JSON.stringify(docs));
      console.log(`✓ ${c.name} : ${docs.length} documents`);
    }
    console.log(`Sauvegarde écrite dans ${dir}`);
  } else {
    if (!arg) throw new Error('Indiquez le dossier de sauvegarde à restaurer');
    const { EJSON } = require('bson');
    for (const f of fs.readdirSync(arg).filter((x) => x.endsWith('.json'))) {
      const name = f.replace(/\.json$/, '');
      const docs = JSON.parse(fs.readFileSync(path.join(arg, f), 'utf8')).map((d) => EJSON.deserialize(convert(d)));
      await db.collection(name).deleteMany({});
      if (docs.length) await db.collection(name).insertMany(docs);
      console.log(`✓ ${name} : ${docs.length} documents restaurés`);
    }
  }
  await mongoose.disconnect();
})().catch((e) => { console.error('✗', e.message); process.exit(1); });

// JSON.stringify transforme ObjectId/Date en chaînes : on réhydrate les identifiants et dates ISO.
function convert(v) {
  const { ObjectId } = mongoose.Types;
  if (Array.isArray(v)) return v.map(convert);
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, convert(x)]));
  if (typeof v === 'string') {
    if (/^[0-9a-f]{24}$/.test(v)) return new ObjectId(v);
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(v)) return new Date(v);
  }
  return v;
}
