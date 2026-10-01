const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

let authToken = '';

async function login() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    authToken = response.data.data.token;
    console.log('✅ Login réussi');
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur login:', error.response?.data || error.message);
    throw error;
  }
}

async function getRooms() {
  try {
    const response = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur récupération chambres:', error.response?.data || error.message);
    throw error;
  }
}

async function getReservations() {
  try {
    const response = await axios.get(`${API_URL}/reservations`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    return response.data.data;
  } catch (error) {
    console.error('❌ Erreur récupération réservations:', error.response?.data || error.message);
    throw error;
  }
}

async function testRoomLogic() {
  console.log('\n=== TEST LOGIQUE CHAMBRES ===\n');

  await login();

  console.log('\n--- Récupération des chambres ---');
  const rooms = await getRooms();
  console.log(`Nombre de chambres: ${rooms.length}`);

  console.log('\n--- Statut des chambres ---');
  rooms.forEach(room => {
    console.log(`\nChambre ${room.number}:`);
    console.log(`  Statut: ${room.status}`);
    console.log(`  Type: ${room.type?.name || 'N/A'}`);
    console.log(`  Prix: ${room.price || 0} FCFA`);
    if (room.currentReservation) {
      console.log(`  Réservation active: ${room.currentReservation.reservation_number}`);
      console.log(`  Client: ${room.currentReservation.client?.first_name} ${room.currentReservation.client?.last_name}`);
      console.log(`  Arrivée: ${room.currentReservation.arrival_date}`);
      console.log(`  Départ: ${room.currentReservation.departure_date}`);
    } else {
      console.log('  Aucune réservation active');
    }
  });

  console.log('\n--- Récupération des réservations ---');
  const reservations = await getReservations();
  console.log(`Nombre de réservations: ${reservations.length}`);

  console.log('\n--- Vérification de la cohérence ---');
  const statusCounts = {
    available: 0,
    occupied: 0,
    reserved: 0,
    maintenance: 0
  };

  rooms.forEach(room => {
    if (statusCounts[room.status] !== undefined) {
      statusCounts[room.status]++;
    }
  });

  console.log('\nCompte par statut:');
  console.log(`  Disponible: ${statusCounts.available}`);
  console.log(`  Occupée: ${statusCounts.occupied}`);
  console.log(`  Réservée: ${statusCounts.reserved}`);
  console.log(`  Maintenance: ${statusCounts.maintenance}`);

  console.log('\n=== TEST TERMINÉ ===\n');
}

testRoomLogic().catch(console.error);
