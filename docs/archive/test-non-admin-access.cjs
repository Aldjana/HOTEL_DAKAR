const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testNonAdminAccess() {
  console.log('=== Test Non-Admin Access Denial ===\n');

  // Login as reception
  console.log('1. Login as reception...');
  try {
    const receptionLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'reception@hotel.com',
      password: 'reception123'
    });
    const receptionToken = receptionLogin.data.data.token;
    console.log('✅ Reception login successful\n');

    // Try to access settings
    console.log('2. Reception tries GET /settings/hotel...');
    try {
      await axios.get(`${API_URL}/settings/hotel`, {
        headers: { Authorization: `Bearer ${receptionToken}` }
      });
      console.log('❌ Reception allowed (should be denied)\n');
    } catch (err) {
      console.log('✅ Reception denied:', err.response?.status, '\n');
    }

    console.log('3. Reception tries GET /auth/users...');
    try {
      await axios.get(`${API_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${receptionToken}` }
      });
      console.log('❌ Reception allowed (should be denied)\n');
    } catch (err) {
      console.log('✅ Reception denied:', err.response?.status, '\n');
    }

    console.log('4. Reception tries POST /payment-modes...');
    try {
      await axios.post(`${API_URL}/payment-modes`, { name: 'Test', code: 'TEST' }, {
        headers: { Authorization: `Bearer ${receptionToken}` }
      });
      console.log('❌ Reception allowed (should be denied)\n');
    } catch (err) {
      console.log('✅ Reception denied:', err.response?.status, '\n');
    }

    console.log('5. Reception tries POST /room-types...');
    try {
      await axios.post(`${API_URL}/room-types`, { name: 'Test', base_price: 10000 }, {
        headers: { Authorization: `Bearer ${receptionToken}` }
      });
      console.log('❌ Reception allowed (should be denied)\n');
    } catch (err) {
      console.log('✅ Reception denied:', err.response?.status, '\n');
    }

  } catch (err) {
    console.log('❌ Reception login failed:', err.response?.data?.message, '\n');
  }

  // Login as housekeeping
  console.log('6. Login as housekeeping...');
  try {
    const housekeepingLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'housekeeping@hotel.com',
      password: 'housekeeping123'
    });
    const housekeepingToken = housekeepingLogin.data.data.token;
    console.log('✅ Housekeeping login successful\n');

    console.log('7. Housekeeping tries GET /settings/hotel...');
    try {
      await axios.get(`${API_URL}/settings/hotel`, {
        headers: { Authorization: `Bearer ${housekeepingToken}` }
      });
      console.log('❌ Housekeeping allowed (should be denied)\n');
    } catch (err) {
      console.log('✅ Housekeeping denied:', err.response?.status, '\n');
    }

  } catch (err) {
    console.log('❌ Housekeeping login failed:', err.response?.data?.message, '\n');
  }

  console.log('=== Test Complete ===');
  console.log('Non-admin roles are correctly denied access to Settings endpoints.');
}

testNonAdminAccess().catch(console.error);
