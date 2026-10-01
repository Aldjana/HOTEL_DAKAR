const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testAdminRBAC() {
  console.log('=== Test RBAC Admin-Only ===\n');

  // Login as admin
  console.log('1. Login as admin...');
  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.data.token;
  console.log('✅ Admin login successful\n');

  // Login as manager
  console.log('2. Login as manager...');
  const managerLogin = await axios.post(`${API_URL}/auth/login`, {
    email: 'manager@hotel.com',
    password: 'manager123'
  });
  const managerToken = managerLogin.data.data.token;
  console.log('✅ Manager login successful\n');

  // Test settings routes
  console.log('=== Testing Settings Routes ===\n');

  console.log('Admin GET /settings/hotel...');
  try {
    await axios.get(`${API_URL}/settings/hotel`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin allowed\n');
  } catch (err) {
    console.log('❌ Admin denied:', err.response?.status, err.response?.data?.message, '\n');
  }

  console.log('Manager GET /settings/hotel...');
  try {
    await axios.get(`${API_URL}/settings/hotel`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('❌ Manager allowed (should be denied)\n');
  } catch (err) {
    console.log('✅ Manager denied:', err.response?.status, '\n');
  }

  console.log('Admin PUT /settings/hotel...');
  try {
    await axios.put(`${API_URL}/settings/hotel`, { name: 'Test Hotel' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin allowed\n');
  } catch (err) {
    console.log('❌ Admin denied:', err.response?.status, err.response?.data?.message, '\n');
  }

  console.log('Manager PUT /settings/hotel...');
  try {
    await axios.put(`${API_URL}/settings/hotel`, { name: 'Test Hotel' }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('❌ Manager allowed (should be denied)\n');
  } catch (err) {
    console.log('✅ Manager denied:', err.response?.status, '\n');
  }

  // Test payment mode routes
  console.log('=== Testing Payment Mode Routes ===\n');

  console.log('Admin POST /payment-modes...');
  try {
    await axios.post(`${API_URL}/payment-modes`, { name: 'Test Mode', code: 'TEST' }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin allowed\n');
  } catch (err) {
    console.log('❌ Admin denied:', err.response?.status, err.response?.data?.message, '\n');
  }

  console.log('Manager POST /payment-modes...');
  try {
    await axios.post(`${API_URL}/payment-modes`, { name: 'Test Mode', code: 'TEST' }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('❌ Manager allowed (should be denied)\n');
  } catch (err) {
    console.log('✅ Manager denied:', err.response?.status, '\n');
  }

  // Test room type routes
  console.log('=== Testing Room Type Routes ===\n');

  console.log('Admin POST /room-types...');
  try {
    await axios.post(`${API_URL}/room-types`, { name: 'Test Type', base_price: 10000 }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin allowed\n');
  } catch (err) {
    console.log('❌ Admin denied:', err.response?.status, err.response?.data?.message, '\n');
  }

  console.log('Manager POST /room-types...');
  try {
    await axios.post(`${API_URL}/room-types`, { name: 'Test Type', base_price: 10000 }, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('❌ Manager allowed (should be denied)\n');
  } catch (err) {
    console.log('✅ Manager denied:', err.response?.status, '\n');
  }

  // Test user management routes
  console.log('=== Testing User Management Routes ===\n');

  console.log('Admin GET /auth/users...');
  try {
    await axios.get(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin allowed\n');
  } catch (err) {
    console.log('❌ Admin denied:', err.response?.status, err.response?.data?.message, '\n');
  }

  console.log('Manager GET /auth/users...');
  try {
    await axios.get(`${API_URL}/auth/users`, {
      headers: { Authorization: `Bearer ${managerToken}` }
    });
    console.log('❌ Manager allowed (should be denied)\n');
  } catch (err) {
    console.log('✅ Manager denied:', err.response?.status, '\n');
  }

  console.log('=== Test Complete ===');
}

testAdminRBAC().catch(console.error);
