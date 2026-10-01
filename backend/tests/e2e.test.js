// Tests fonctionnels de bout en bout de l'API (serveur démarré + base vide).
//   BASE_URL=http://localhost:3100/api/v1 node --test tests/e2e.test.js
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');

const BASE = process.env.BASE_URL || 'http://localhost:3100/api/v1';
const stamp = Date.now().toString().slice(-6);
const day = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

const state = {};
const call = async (method, path, { token, body, raw } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (raw) return res;
  let json = null;
  try { json = await res.json(); } catch (e) { /* pas de corps */ }
  return { status: res.status, body: json, data: json?.data };
};
const admin = () => state.admin.token;

describe('Authentification', () => {
  test('S1 login admin + /me', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'admin@hotel.com', password: 'admin123' } });
    assert.equal(r.status, 200);
    assert.ok(r.data.token && r.data.refreshToken);
    state.admin = r.data;
    const me = await call('GET', '/auth/me', { token: admin() });
    assert.equal(me.status, 200);
    assert.equal(me.data.email, 'admin@hotel.com');
  });
  test('mauvais mot de passe → 401 (pas 500)', async () => {
    const r = await call('POST', '/auth/login', { body: { email: 'admin@hotel.com', password: 'nope' } });
    assert.equal(r.status, 401);
    assert.equal(r.body.code, 'INVALID_CREDENTIALS');
  });
  test('sans token → 401 ; token bidon → 401', async () => {
    assert.equal((await call('GET', '/clients')).status, 401);
    assert.equal((await call('GET', '/clients', { token: 'abc.def.ghi' })).status, 401);
  });
  test('refresh valide → nouveaux jetons ; refresh invalide → 401', async () => {
    const r = await call('POST', '/auth/refresh-token', { body: { refresh_token: state.admin.refreshToken } });
    assert.equal(r.status, 200);
    assert.ok(r.data.token && r.data.refreshToken);
    const bad = await call('POST', '/auth/refresh-token', { body: { refresh_token: 'garbage' } });
    assert.equal(bad.status, 401);
    assert.equal(bad.body.code, 'REFRESH_INVALID');
  });
});

describe('Utilisateurs & permissions (S15, S16)', () => {
  test('création des 3 autres rôles', async () => {
    for (const role of ['manager', 'reception', 'housekeeping']) {
      const r = await call('POST', '/auth/register', { token: admin(), body: { email: `${role}${stamp}@hotel.test`, password: 'Passw0rd!', first_name: role, last_name: 'Test', role } });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      const l = await call('POST', '/auth/login', { body: { email: `${role}${stamp}@hotel.test`, password: 'Passw0rd!' } });
      assert.equal(l.status, 200);
      state[role] = { token: l.data.token, id: l.data.user._id };
    }
  });
  test('email en double → 409', async () => {
    const r = await call('POST', '/auth/register', { token: admin(), body: { email: `manager${stamp}@hotel.test`, password: 'Passw0rd!', first_name: 'Dup', last_name: 'Test', role: 'reception' } });
    assert.equal(r.status, 409);
  });
  test('validation : mot de passe court → 400', async () => {
    const r = await call('POST', '/auth/register', { token: admin(), body: { email: 'x@y.test', password: '123', first_name: 'Xx', last_name: 'Yy' } });
    assert.equal(r.status, 400);
  });
  test('seul l\'admin gère les utilisateurs', async () => {
    assert.equal((await call('GET', '/auth/users', { token: state.reception.token })).status, 403);
    assert.equal((await call('GET', '/auth/users', { token: state.manager.token })).status, 403);
    const r = await call('GET', '/auth/users', { token: admin() });
    assert.equal(r.status, 200);
    assert.ok(r.data.length >= 4);
  });
  test('ménage : pas de finance, pas de clients ; réception : pas de rapports', async () => {
    assert.equal((await call('GET', '/payments', { token: state.housekeeping.token })).status, 403);
    assert.equal((await call('GET', '/clients', { token: state.housekeeping.token })).status, 403);
    assert.equal((await call('GET', '/cash/daily', { token: state.housekeeping.token })).status, 403);
    assert.equal((await call('GET', '/reports/overview', { token: state.reception.token })).status, 403);
    assert.equal((await call('GET', '/reports/export/payments?format=xlsx', { token: state.reception.token })).status, 403);
  });
  test('désactivation : le compte ne peut plus se connecter ni utiliser son token', async () => {
    const c = await call('POST', '/auth/register', { token: admin(), body: { email: `tmp${stamp}@hotel.test`, password: 'Passw0rd!', first_name: 'Tmp', last_name: 'User', role: 'reception' } });
    const l = await call('POST', '/auth/login', { body: { email: `tmp${stamp}@hotel.test`, password: 'Passw0rd!' } });
    const up = await call('PUT', `/auth/users/${c.data._id}`, { token: admin(), body: { is_active: false } });
    assert.equal(up.status, 200);
    assert.equal((await call('GET', '/auth/me', { token: l.data.token })).status, 401);
    assert.equal((await call('POST', '/auth/login', { body: { email: `tmp${stamp}@hotel.test`, password: 'Passw0rd!' } })).status, 401);
    assert.equal((await call('POST', '/auth/refresh-token', { body: { refresh_token: l.data.refreshToken } })).status, 401);
  });
  test('l\'admin ne peut pas se désactiver / supprimer lui-même', async () => {
    const me = await call('GET', '/auth/me', { token: admin() });
    assert.equal((await call('PUT', `/auth/users/${me.data._id}`, { token: admin(), body: { is_active: false } })).status, 400);
    assert.equal((await call('DELETE', `/auth/users/${me.data._id}`, { token: admin() })).status, 400);
  });
  test('changement de mot de passe', async () => {
    const r = await call('PUT', '/auth/change-password', { token: state.reception.token, body: { current_password: 'Passw0rd!', new_password: 'NewPassw0rd!' } });
    assert.equal(r.status, 200);
    state.reception.token = r.data.token;
    const wrong = await call('PUT', '/auth/change-password', { token: state.reception.token, body: { current_password: 'bad', new_password: 'NewPassw0rd!2' } });
    assert.equal(wrong.status, 400);
  });
});

describe('Paramètres (S18)', () => {
  test('lecture / mise à jour identité + taxes', async () => {
    const r = await call('PUT', '/settings/hotel', { token: admin(), body: { name: 'Hôtel Test Dakar', address: 'Dakar', phone: '+221 33 000 00 00', ninea: '123456789', check_in_time: '14:00', check_out_time: '12:00', stay_tax: 0, vat_rate: 0 } });
    assert.equal(r.status, 200);
    const g = await call('GET', '/settings/hotel', { token: state.reception.token });
    assert.equal(g.data.name, 'Hôtel Test Dakar');
    assert.equal((await call('PUT', '/settings/hotel', { token: state.reception.token, body: { name: 'Hack' } })).status, 403);
    assert.equal((await call('PUT', '/settings/hotel', { token: admin(), body: { check_in_time: '99:99' } })).status, 400);
  });
});

describe('Chambres & clients (S2, S3)', () => {
  test('types de chambre présents (référentiel)', async () => {
    const r = await call('GET', '/room-types', { token: admin() });
    assert.ok(r.data.length >= 9);
    state.type = r.data.find((t) => t.code === 'standard') || r.data[0];
    state.suite = r.data.find((t) => t.code === 'suite') || r.data[1];
  });
  test('S3 création chambres + doublon + prix', async () => {
    for (const [n, t, price] of [[`1${stamp}`, state.type, 30000], [`2${stamp}`, state.type, 30000], [`3${stamp}`, state.suite, 70000]]) {
      const r = await call('POST', '/rooms', { token: admin(), body: { room_number: n, room_type_id: t._id, base_price: price, floor: 1 } });
      assert.equal(r.status, 201, JSON.stringify(r.body));
      state[`room${n[0]}`] = r.data;
    }
    const dup = await call('POST', '/rooms', { token: admin(), body: { room_number: `1${stamp}`, room_type_id: state.type._id, base_price: 1 } });
    assert.equal(dup.status, 409);
    assert.equal((await call('POST', '/rooms', { token: state.reception.token, body: { room_number: 'Z', room_type_id: state.type._id, base_price: 1 } })).status, 403);
  });
  test('S2 création client + doublon + recherche', async () => {
    const r = await call('POST', '/clients', { token: state.reception.token, body: { first_name: 'Awa', last_name: 'Diop', phone: `77${stamp}0`, email: `awa${stamp}@test.sn`, client_type: 'individual', nationality: 'Sénégalaise' } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    state.client = r.data;
    const dup = await call('POST', '/clients', { token: state.reception.token, body: { first_name: 'Awa', last_name: 'Diop', phone: `77${stamp}0` } });
    assert.equal(dup.status, 409);
    assert.equal(dup.body.code, 'DUPLICATE_CLIENT');
    const c2 = await call('POST', '/clients', { token: state.reception.token, body: { first_name: 'Moussa', last_name: 'Ba', client_type: 'company', company: 'Sonatel' } });
    assert.equal(c2.status, 201);
    state.client2 = c2.data;
    const s = await call('GET', '/clients/search?q=diop', { token: state.reception.token });
    assert.equal(s.data.length, 1);
    const bad = await call('POST', '/clients', { token: state.reception.token, body: { first_name: 'A', last_name: '' } });
    assert.equal(bad.status, 400);
  });
});

describe('Réservations, disponibilité, paiements (S4-S8)', () => {
  test('S5 disponibilité', async () => {
    const r = await call('GET', `/rooms/available?start_date=${day(0)}&end_date=${day(3)}`, { token: state.reception.token });
    assert.equal(r.status, 200);
    assert.ok(r.data.length >= 3);
  });
  test('S4 création réservation (prix + total calculés côté serveur)', async () => {
    const r = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client._id, room_id: state.room1._id, arrival_date: day(0), departure_date: day(3), adults_count: 2, source: 'whatsapp', total_amount: 1 } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.data.nights, 3);
    assert.equal(r.data.total_amount, 90000);
    assert.equal(r.data.payment_status, 'unpaid');
    assert.match(r.data.reservation_number, /^RES-\d{4}-\d{6}$/);
    state.res1 = r.data;
  });
  test('pas de double réservation (chevauchement) → 409', async () => {
    const r = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client2._id, room_id: state.room1._id, arrival_date: day(1), departure_date: day(2), adults_count: 1 } });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, 'ROOM_NOT_AVAILABLE');
    const edge = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client2._id, room_id: state.room1._id, arrival_date: day(3), departure_date: day(5), adults_count: 1 } });
    assert.equal(edge.status, 201, 'départ le jour de l\'arrivée suivante autorisé');
    state.resEdge = edge.data;
  });
  test('chambre indisponible n\'apparaît plus dans /available', async () => {
    const r = await call('GET', `/rooms/available?start_date=${day(1)}&end_date=${day(2)}`, { token: state.reception.token });
    assert.ok(!r.data.some((x) => x._id === state.room1._id));
  });
  test('validation : dates inversées, capacité, prix manuel interdit à la réception', async () => {
    const b = { client_id: state.client._id, room_id: state.room2._id };
    assert.equal((await call('POST', '/reservations', { token: state.reception.token, body: { ...b, arrival_date: day(5), departure_date: day(4), adults_count: 1 } })).status, 400);
    assert.equal((await call('POST', '/reservations', { token: state.reception.token, body: { ...b, arrival_date: day(10), departure_date: day(11), adults_count: 9 } })).status, 400);
    const price = await call('POST', '/reservations', { token: state.reception.token, body: { ...b, arrival_date: day(10), departure_date: day(11), adults_count: 1, nightly_rate: 5 } });
    assert.equal(price.status, 403);
  });
  test('prix manuel + remise pour le manager', async () => {
    const r = await call('POST', '/reservations', { token: state.manager.token, body: { client_id: state.client2._id, room_id: state.room2._id, arrival_date: day(20), departure_date: day(22), adults_count: 1, nightly_rate: 25000, discount_amount: 5000 } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.data.total_amount, 45000);
    assert.equal(r.data.price_overridden, true);
    state.resManual = r.data;
  });
  test('S6 paiement partiel (avance) + validations', async () => {
    const r = await call('POST', '/payments', { token: state.reception.token, body: { reservation_id: state.res1._id, amount: 30000, payment_method: 'wave', reference: 'W123' } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.data.reservation_summary.payment_status, 'deposit');
    assert.equal(r.data.reservation_summary.balance_amount, 60000);
    state.pay1 = r.data;
    assert.equal((await call('POST', '/payments', { token: state.reception.token, body: { reservation_id: state.res1._id, amount: 999999, payment_method: 'cash' } })).status, 400);
    assert.equal((await call('POST', '/payments', { token: state.reception.token, body: { reservation_id: state.res1._id, amount: 100, payment_method: 'bitcoin' } })).status, 400);
    assert.equal((await call('POST', '/payments', { token: state.reception.token, body: { reservation_id: state.res1._id, amount: 100, payment_method: 'bank_transfer' } })).status, 400);
    assert.equal(r.data.processed_by._id !== undefined, true);
  });
  test('modes de paiement cohérents (credit_card, free_money, orange_money…)', async () => {
    const m = await call('GET', '/payments/methods', { token: state.reception.token });
    const codes = m.data.map((x) => x.code);
    for (const c of ['cash', 'wave', 'orange_money', 'free_money', 'credit_card', 'bank_transfer', 'check', 'ota']) assert.ok(codes.includes(c), c);
    const r = await call('POST', '/payments', { token: state.reception.token, body: { reservation_id: state.res1._id, amount: 10000, payment_method: 'credit_card' } });
    assert.equal(r.status, 201);
    state.pay2 = r.data;
  });
  test('correction / suppression de paiement : réception interdite, manager avec motif', async () => {
    assert.equal((await call('PUT', `/payments/${state.pay2._id}`, { token: state.reception.token, body: { amount: 5000, reason: 'x' } })).status, 403);
    assert.equal((await call('DELETE', `/payments/${state.pay2._id}`, { token: state.reception.token })).status, 403);
    assert.equal((await call('PUT', `/payments/${state.pay2._id}`, { token: state.manager.token, body: { amount: 5000 } })).status, 400);
    const up = await call('PUT', `/payments/${state.pay2._id}`, { token: state.manager.token, body: { amount: 5000, reason: 'erreur de saisie' } });
    assert.equal(up.status, 200);
    let res = await call('GET', `/reservations/${state.res1._id}`, { token: admin() });
    assert.equal(res.data.paid_amount, 35000);
    const del = await call('DELETE', `/payments/${state.pay2._id}`, { token: state.manager.token, body: { reason: 'doublon' } });
    assert.equal(del.status, 200);
    res = await call('GET', `/reservations/${state.res1._id}`, { token: admin() });
    assert.equal(res.data.paid_amount, 30000);
    const hist = await call('GET', `/history-logs?entity_type=payment`, { token: admin() });
    assert.ok(hist.data.some((h) => h.action === 'void'));
  });
});

describe('Séjour : check-in, occupation, check-out (S7-S10)', () => {
  test('S7 check-in', async () => {
    const r = await call('POST', `/reservations/${state.res1._id}/check-in`, { token: state.reception.token, body: {} });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.data.status, 'checked_in');
    assert.equal((await call('POST', `/reservations/${state.res1._id}/check-in`, { token: state.reception.token, body: {} })).status, 409);
  });
  test('S8/S9 chambre occupée avec occupant, dates, réservation', async () => {
    const r = await call('GET', `/rooms/${state.room1._id}`, { token: state.reception.token });
    assert.equal(r.data.status, 'occupied');
    assert.equal(r.data.currentReservation.client_name, 'Awa Diop');
    assert.equal(r.data.currentReservation.reservation_number, state.res1.reservation_number);
    assert.ok(r.data.currentReservation.arrival_date && r.data.currentReservation.departure_date);
    const list = await call('GET', '/rooms?limit=100', { token: state.reception.token });
    const row = list.data.find((x) => x._id === state.room1._id);
    assert.equal(row.currentReservation.client_name, 'Awa Diop');
    const avail = await call('GET', `/rooms/available?start_date=${day(0)}&end_date=${day(1)}`, { token: state.reception.token });
    assert.ok(!avail.data.some((x) => x._id === state.room1._id));
  });
  test('statut manuel occupé interdit ; libération impossible tant que le client est là', async () => {
    assert.equal((await call('PATCH', `/rooms/${state.room1._id}/status`, { token: state.reception.token, body: { status: 'occupied' } })).status, 400);
    assert.equal((await call('PATCH', `/rooms/${state.room1._id}/status`, { token: state.reception.token, body: { status: 'available' } })).status, 409);
  });
  test('S13 changement de chambre en cours de séjour', async () => {
    const r = await call('POST', `/reservations/${state.res1._id}/change-room`, { token: state.reception.token, body: { room_id: state.room2._id, reason: 'Climatisation en panne', keep_rate: true } });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.data.room_id._id, state.room2._id);
    assert.equal(r.data.total_amount, 90000, 'tarif conservé');
    const old = await call('GET', `/rooms/${state.room1._id}`, { token: admin() });
    assert.equal(old.data.status, 'cleaning');
    const nw = await call('GET', `/rooms/${state.room2._id}`, { token: admin() });
    assert.equal(nw.data.status, 'occupied');
    // et retour
    const back = await call('POST', `/reservations/${state.res1._id}/change-room`, { token: state.reception.token, body: { room_id: state.room3._id, reason: 'Surclassement' } });
    assert.equal(back.status, 200);
    assert.equal(back.data.total_amount, 210000, 'nouveau tarif (suite 70000 × 3)');
    state.res1Room = state.room3;
    const solde = await call('GET', `/reservations/${state.res1._id}`, { token: admin() });
    assert.equal(solde.data.balance_amount, 180000);
  });
  test('S12 modification : dates + persons, avec contrôle de conflit', async () => {
    const conflict = await call('PUT', `/reservations/${state.resEdge._id}`, { token: state.reception.token, body: { arrival_date: day(1) } });
    assert.equal(conflict.status, 200, 'la chambre 1 est libre depuis le changement');
    const back = await call('PUT', `/reservations/${state.resEdge._id}`, { token: state.reception.token, body: { arrival_date: day(3), adults_count: 2 } });
    assert.equal(back.status, 200);
    assert.equal(back.data.adults_count, 2);
    const ext = await call('PUT', `/reservations/${state.res1._id}`, { token: state.reception.token, body: { departure_date: day(4) } });
    assert.equal(ext.status, 200, JSON.stringify(ext.body));
    assert.equal(ext.data.nights, 4);
    assert.equal(ext.data.total_amount, 280000);
  });
  test('check-out refusé si solde impayé, accepté avec paiement — S10', async () => {
    const r = await call('POST', `/reservations/${state.res1._id}/check-out`, { token: state.reception.token, body: {} });
    assert.equal(r.status, 409);
    assert.equal(r.body.code, 'BALANCE_DUE');
    const ok = await call('POST', `/reservations/${state.res1._id}/check-out`, { token: state.reception.token, body: { payment: { amount: 250000, payment_method: 'cash' } } });
    assert.equal(ok.status, 200, JSON.stringify(ok.body));
    assert.equal(ok.data.status, 'checked_out');
    assert.equal(ok.data.payment_status, 'paid');
    const room = await call('GET', `/rooms/${state.room3._id}`, { token: admin() });
    assert.equal(room.data.status, 'cleaning');
    assert.equal(room.data.currentReservation, null);
  });
  test('ménage : tâche créée au check-out, terminée → chambre propre', async () => {
    const t = await call('GET', '/housekeeping?status=pending&limit=100', { token: state.housekeeping.token });
    assert.equal(t.status, 200);
    const mine = t.data.find((x) => x.room_id?._id === state.room3._id);
    assert.ok(mine, 'tâche de nettoyage');
    const s = await call('POST', `/housekeeping/${mine._id}/start`, { token: state.housekeeping.token });
    assert.equal(s.data.status, 'in_progress');
    const c = await call('POST', `/housekeeping/${mine._id}/complete`, { token: state.housekeeping.token });
    assert.equal(c.data.status, 'completed');
    const room = await call('GET', `/rooms/${state.room3._id}`, { token: admin() });
    assert.equal(room.data.status, 'clean');
  });
  test('S11 facture générée au check-out, PDF valide, numérotation', async () => {
    const inv = await call('GET', `/invoices?reservation_id=${state.res1._id}`, { token: state.reception.token });
    assert.equal(inv.data.length, 1);
    const i = inv.data[0];
    assert.match(i.invoice_number, /^FAC-\d{4}-\d{6}$/);
    assert.equal(i.total_amount, 280000);
    assert.equal(i.status, 'paid');
    const pdf = await call('GET', `/invoices/${i._id}/pdf`, { token: state.reception.token, raw: true });
    assert.equal(pdf.status, 200);
    assert.equal(pdf.headers.get('content-type'), 'application/pdf');
    const buf = Buffer.from(await pdf.arrayBuffer());
    assert.equal(buf.slice(0, 5).toString(), '%PDF-');
    assert.ok(buf.length > 1500);
    const dup = await call('POST', `/invoices/reservation/${state.res1._id}`, { token: state.reception.token, body: {} });
    assert.equal(dup.status, 409);
    const pro = await call('POST', `/invoices/reservation/${state.res1._id}`, { token: state.reception.token, body: { type: 'proforma' } });
    assert.equal(pro.status, 201);
    assert.match(pro.data.invoice_number, /^PRO-/);
    state.invoice = i;
    // reçu PDF
    const rc = await call('GET', `/payments/${state.pay1._id}/receipt`, { token: state.reception.token, raw: true });
    assert.equal(rc.status, 200);
    assert.equal(Buffer.from(await rc.arrayBuffer()).slice(0, 5).toString(), '%PDF-');
    const sum = await call('GET', `/reservations/${state.res1._id}/summary-pdf`, { token: state.reception.token, raw: true });
    assert.equal(sum.status, 200);
    const docs = await call('GET', '/documents', { token: state.reception.token });
    assert.ok(docs.data.length >= 3);
  });
});

describe('Annulation, no-show, multi-chambres (S14)', () => {
  test('S14 annulation libère la chambre', async () => {
    const r = await call('POST', `/reservations/${state.resEdge._id}/cancel`, { token: state.reception.token, body: { reason: 'Client indisponible' } });
    assert.equal(r.status, 200);
    assert.equal(r.data.status, 'cancelled');
    assert.equal((await call('POST', `/reservations/${state.resEdge._id}/cancel`, { token: state.reception.token, body: {} })).status, 409);
    const again = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client2._id, room_id: state.room1._id, arrival_date: day(3), departure_date: day(5), adults_count: 1 } });
    assert.equal(again.status, 201, 'chambre à nouveau réservable');
    await call('POST', `/reservations/${again.data._id}/cancel`, { token: state.reception.token, body: {} });
  });
  test('annulation d\'un séjour en cours refusée', async () => {
    const r = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client._id, room_id: state.room2._id, arrival_date: day(0), departure_date: day(1), adults_count: 1 } });
    assert.equal(r.status, 201);
    const early = await call('POST', `/reservations/${r.data._id}/check-in`, { token: state.reception.token, body: {} });
    assert.equal(early.status, 409, 'chambre à nettoyer : check-in refusé');
    assert.equal(early.body.code, 'ROOM_NOT_CLEAN');
    await call('PATCH', `/rooms/${state.room2._id}/status`, { token: state.housekeeping.token, body: { status: 'clean' } });
    const ci = await call('POST', `/reservations/${r.data._id}/check-in`, { token: state.reception.token, body: {} });
    assert.equal(ci.status, 200);
    assert.equal((await call('POST', `/reservations/${r.data._id}/cancel`, { token: state.reception.token, body: {} })).status, 409);
    state.resLive = r.data;
  });
  test('réservation multi-chambres', async () => {
    const r = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client2._id, room_ids: [state.room1._id, state.room3._id], arrival_date: day(30), departure_date: day(32), adults_count: 3, status: 'pending' } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal(r.data.rooms.length, 2);
    assert.equal(r.data.total_amount, (30000 + 70000) * 2);
    assert.equal(r.data.status, 'pending');
    const blocked = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client._id, room_id: state.room3._id, arrival_date: day(31), departure_date: day(33), adults_count: 1 } });
    assert.equal(blocked.status, 409);
  });
  test('planning', async () => {
    const r = await call('GET', `/reports/planning?start=${day(0)}&days=14`, { token: state.reception.token });
    assert.equal(r.status, 200);
    assert.equal(r.data.days.length, 14);
    const r3 = r.data.rooms.find((x) => x._id === state.room1._id);
    assert.ok(Array.isArray(r3.reservations));
  });
});

describe('Caisse, rapports, exports (S17)', () => {
  test('caisse du jour : totaux par mode, filtres', async () => {
    const r = await call('GET', '/cash/daily', { token: state.reception.token });
    assert.equal(r.status, 200);
    assert.equal(r.data.totals.net_total, 30000 + 250000);
    assert.equal(r.data.by_method.wave.net, 30000);
    assert.equal(r.data.by_method.cash.net, 250000);
    const f = await call('GET', '/cash/daily?method=cash', { token: state.reception.token });
    assert.equal(f.data.totals.net_total, 250000);
  });
  test('remboursement partiel (manager) et effet sur la réservation', async () => {
    const r = await call('POST', `/payments/${state.pay1._id}/refund`, { token: state.manager.token, body: { amount: 5000, reason: 'geste commercial' } });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const d = await call('GET', '/cash/daily', { token: admin() });
    assert.equal(d.data.totals.net_total, 275000);
    assert.equal((await call('POST', `/payments/${state.pay1._id}/refund`, { token: state.reception.token, body: {} })).status, 403);
  });
  test('rapports overview / occupation / créances / usage', async () => {
    const o = await call('GET', `/reports/overview?from=${day(-6)}&to=${day(0)}`, { token: state.manager.token });
    assert.equal(o.status, 200);
    assert.equal(o.data.revenue, 275000);
    assert.equal(o.data.revenue_series.length, 7);
    const oc = await call('GET', `/reports/occupancy?from=${day(0)}&to=${day(6)}`, { token: state.manager.token });
    assert.equal(oc.data.rows.length, 7);
    const rc = await call('GET', '/reports/receivables', { token: state.manager.token });
    assert.equal(rc.status, 200);
    const us = await call('GET', '/reports/usage', { token: state.manager.token });
    assert.ok(us.data.logins >= 1);
  });
  test('exports Excel et PDF réellement générés', async () => {
    for (const type of ['reservations', 'clients', 'payments', 'cash', 'occupancy', 'receivables']) {
      const x = await call('GET', `/reports/export/${type}?format=xlsx`, { token: state.manager.token, raw: true });
      assert.equal(x.status, 200, `${type} xlsx`);
      const bx = Buffer.from(await x.arrayBuffer());
      assert.equal(bx.slice(0, 2).toString(), 'PK', `${type} xlsx zip`);
      const p = await call('GET', `/reports/export/${type}?format=pdf`, { token: state.manager.token, raw: true });
      assert.equal(p.status, 200, `${type} pdf`);
      assert.equal(Buffer.from(await p.arrayBuffer()).slice(0, 5).toString(), '%PDF-', `${type} pdf`);
    }
    assert.equal((await call('GET', '/reports/export/nope?format=pdf', { token: admin() })).status, 400);
  });
  test('clôture de caisse : verrouille la journée', async () => {
    assert.equal((await call('POST', '/cash/close', { token: state.reception.token, body: {} })).status, 403);
    const c = await call('POST', '/cash/close', { token: state.manager.token, body: { counted_cash: 249000, notes: 'test' } });
    assert.equal(c.status, 201, JSON.stringify(c.body));
    assert.equal(c.data.difference, 249000 - 250000 + 0);
    assert.equal((await call('POST', '/cash/close', { token: state.manager.token, body: {} })).status, 409);
    const p = await call('POST', '/payments', { token: state.reception.token, body: { reservation_id: state.resManual._id, amount: 1000, payment_method: 'cash' } });
    assert.equal(p.status, 409);
    assert.equal(p.body.code, 'CASH_CLOSED');
    assert.equal((await call('DELETE', `/cash/closures/${new Date().toISOString().slice(0, 10)}`, { token: state.manager.token })).status, 200);
  });
  test('tableau de bord', async () => {
    const d = await call('GET', '/dashboard/statistics', { token: state.reception.token });
    assert.equal(d.status, 200);
    assert.equal(d.data.rooms.total, 3);
    assert.equal(typeof d.data.revenue_today, 'number');
    const h = await call('GET', '/dashboard/statistics', { token: state.housekeeping.token });
    assert.equal(h.status, 200);
    assert.equal(h.data.revenue_today, undefined, 'pas de finance pour le ménage');
  });
  test('journal d\'audit alimenté', async () => {
    const h = await call('GET', '/history-logs?limit=200', { token: admin() });
    const actions = new Set(h.data.map((x) => x.action));
    for (const a of ['login', 'create', 'check_in', 'check_out', 'cancel', 'change_room', 'payment', 'void', 'export', 'close_cash']) assert.ok(actions.has(a), `action ${a}`);
    assert.equal((await call('GET', '/history-logs', { token: state.reception.token })).status, 403);
  });
});

describe('Chambres : gestion (S3 suite)', () => {
  test('maintenance / désactivation / suppression protégée', async () => {
    const r = await call('POST', '/rooms', { token: admin(), body: { room_number: `9${stamp}`, room_type_id: state.type._id, base_price: 20000 } });
    const id = r.data._id;
    assert.equal((await call('PATCH', `/rooms/${id}/status`, { token: state.housekeeping.token, body: { status: 'blocked' } })).status, 403);
    assert.equal((await call('PATCH', `/rooms/${id}/status`, { token: state.housekeeping.token, body: { status: 'maintenance' } })).status, 200);
    const blocked = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client._id, room_id: id, arrival_date: day(0), departure_date: day(1), adults_count: 1 } });
    assert.equal(blocked.status, 409);
    await call('PATCH', `/rooms/${id}/status`, { token: admin(), body: { status: 'available' } });
    assert.equal((await call('PATCH', `/rooms/${id}/active`, { token: admin(), body: { is_active: false } })).status, 200);
    const inactive = await call('POST', '/reservations', { token: state.reception.token, body: { client_id: state.client._id, room_id: id, arrival_date: day(0), departure_date: day(1), adults_count: 1 } });
    assert.equal(inactive.status, 409);
    assert.equal((await call('DELETE', `/rooms/${id}`, { token: admin() })).status, 200);
    assert.equal((await call('DELETE', `/rooms/${state.room1._id}`, { token: admin() })).status, 409);
  });
  test('client avec historique : suppression → désactivation', async () => {
    const r = await call('DELETE', `/clients/${state.client._id}`, { token: state.manager.token });
    assert.equal(r.status, 200);
    assert.equal(r.data.deactivated, true);
    const h = await call('GET', `/clients/${state.client2._id}/history`, { token: state.reception.token });
    assert.equal(h.status, 200);
    assert.ok(h.data.reservations.length >= 1);
  });
  test('déconnexion révoque les jetons', async () => {
    const l = await call('POST', '/auth/login', { body: { email: 'admin@hotel.com', password: 'admin123' } });
    assert.equal((await call('POST', '/auth/logout', { token: l.data.token })).status, 200);
    assert.equal((await call('GET', '/auth/me', { token: l.data.token })).status, 401);
    assert.equal((await call('POST', '/auth/refresh-token', { body: { refresh_token: l.data.refreshToken } })).status, 401);
  });
});
