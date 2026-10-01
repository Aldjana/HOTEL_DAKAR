const axios = require('axios');

const API_BASE = 'http://localhost:3000/api/v1';

async function testEndpoints() {
  let token = null;

  try {
    // 1. Login
    console.log('\n=== 1. LOGIN ===');
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    token = loginRes.data.data.token;
    console.log('✓ Login réussi');
    console.log('Token:', token.substring(0, 50) + '...');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Dashboard Statistics
    console.log('\n=== 2. DASHBOARD STATISTICS ===');
    try {
      const statsRes = await axios.get(`${API_BASE}/dashboard/statistics`, { headers });
      console.log('✓ Statistiques:', JSON.stringify(statsRes.data.data, null, 2));
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 3. Reservations
    console.log('\n=== 3. RESERVATIONS ===');
    try {
      const resRes = await axios.get(`${API_BASE}/reservations`, { headers });
      console.log('✓ Réservations:', resRes.data.data.length, 'réservations');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 4. Rooms
    console.log('\n=== 4. ROOMS ===');
    try {
      const roomsRes = await axios.get(`${API_BASE}/rooms`, { headers });
      console.log('✓ Chambres:', roomsRes.data.data.length, 'chambres');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 5. Clients
    console.log('\n=== 5. CLIENTS ===');
    try {
      const clientsRes = await axios.get(`${API_BASE}/clients`, { headers });
      console.log('✓ Clients:', clientsRes.data.data.length, 'clients');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 6. Payments
    console.log('\n=== 6. PAYMENTS ===');
    try {
      const payRes = await axios.get(`${API_BASE}/payments`, { headers });
      console.log('✓ Paiements:', payRes.data.data.length, 'paiements');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 7. Rooms by status (Housekeeping)
    console.log('\n=== 7. ROOMS BY STATUS (HOUSEKEEPING) ===');
    try {
      const cleanRes = await axios.get(`${API_BASE}/rooms/by-status?status=to_clean`, { headers });
      console.log('✓ Chambres à nettoyer:', cleanRes.data.data.length, 'chambres');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 8. Room Types
    console.log('\n=== 8. ROOM TYPES ===');
    try {
      const typesRes = await axios.get(`${API_BASE}/room-types`, { headers });
      console.log('✓ Types de chambres:', typesRes.data.data.length, 'types');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 9. Payment Modes
    console.log('\n=== 9. PAYMENT MODES ===');
    try {
      const modesRes = await axios.get(`${API_BASE}/payment-modes`, { headers });
      console.log('✓ Modes de paiement:', modesRes.data.data.length, 'modes');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 10. Reservation Sources
    console.log('\n=== 10. RESERVATION SOURCES ===');
    try {
      const sourcesRes = await axios.get(`${API_BASE}/reservation-sources`, { headers });
      console.log('✓ Sources de réservation:', sourcesRes.data.data.length, 'sources');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 11. Users
    console.log('\n=== 11. USERS ===');
    try {
      const usersRes = await axios.get(`${API_BASE}/auth/users`, { headers });
      console.log('✓ Utilisateurs:', usersRes.data.data.users.length, 'utilisateurs');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    // 12. Invoices
    console.log('\n=== 12. INVOICES ===');
    try {
      const invRes = await axios.get(`${API_BASE}/invoices`, { headers });
      console.log('✓ Factures:', invRes.data.data.length, 'factures');
    } catch (e) {
      console.log('✗ Erreur:', e.response?.data?.message || e.message);
    }

    console.log('\n=== TEST TERMINÉ ===');

  } catch (error) {
    console.error('Erreur critique:', error.response?.data || error.message);
  }
}

testEndpoints();
