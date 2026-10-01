const axios = require('axios');

async function testPermissions() {
  console.log('=== TESTING BACKEND PERMISSIONS ===\n');
  
  // Login as different roles
  const logins = {
    admin: (await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'admin@hotel.com', password: 'admin123' })).data.data.token,
    reception: (await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'reception@hotel.com', password: 'reception123' })).data.data.token,
    manager: (await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'manager@hotel.com', password: 'manager123' })).data.data.token,
    housekeeping: (await axios.post('http://localhost:3000/api/v1/auth/login', { email: 'housekeeping@hotel.com', password: 'house123' })).data.data.token,
  };
  
  // Test endpoints that should be role-restricted
  const tests = [
    {
      endpoint: '/api/v1/auth/users',
      method: 'GET',
      allowedRoles: ['admin'],
      description: 'Get all users (admin only)'
    },
    {
      endpoint: '/api/v1/settings/hotel',
      method: 'GET',
      allowedRoles: ['admin', 'manager'],
      description: 'Get hotel settings (admin, manager only)'
    },
    {
      endpoint: '/api/v1/dashboard/statistics',
      method: 'GET',
      allowedRoles: ['admin', 'manager', 'reception'],
      description: 'Get dashboard statistics (admin, manager, reception)'
    },
    {
      endpoint: '/api/v1/clients',
      method: 'GET',
      allowedRoles: ['admin', 'manager', 'reception'],
      description: 'Get clients (admin, manager, reception)'
    },
    {
      endpoint: '/api/v1/reservations',
      method: 'GET',
      allowedRoles: ['admin', 'manager', 'reception'],
      description: 'Get reservations (admin, manager, reception)'
    },
    {
      endpoint: '/api/v1/rooms',
      method: 'GET',
      allowedRoles: ['admin', 'manager', 'reception'],
      description: 'Get rooms (admin, manager, reception)'
    },
    {
      endpoint: '/api/v1/rooms/by-status?status=available',
      method: 'GET',
      allowedRoles: ['admin', 'manager', 'reception', 'housekeeping'],
      description: 'Get rooms by status (all roles)'
    },
    {
      endpoint: '/api/v1/payments',
      method: 'GET',
      allowedRoles: ['admin', 'manager', 'reception'],
      description: 'Get payments (admin, manager, reception)'
    },
  ];
  
  for (const test of tests) {
    console.log(`\n--- Testing: ${test.description} ---`);
    
    for (const [role, token] of Object.entries(logins)) {
      try {
        const method = test.method.toLowerCase();
        if (method === 'get') {
          await axios.get(`http://localhost:3000${test.endpoint}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (method === 'post') {
          await axios.post(`http://localhost:3000${test.endpoint}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
        
        const shouldAllow = test.allowedRoles.includes(role);
        if (shouldAllow) {
          console.log(`✅ ${role}: Access granted (expected)`);
        } else {
          console.log(`❌ ${role}: Access granted (should be denied!)`);
        }
      } catch (error) {
        const shouldDeny = !test.allowedRoles.includes(role);
        if (shouldDeny && error.response?.status === 403) {
          console.log(`✅ ${role}: Access denied (expected)`);
        } else if (shouldDeny && error.response?.status === 401) {
          console.log(`❌ ${role}: 401 Unauthorized (should be 403 Forbidden)`);
        } else if (!shouldDeny) {
          console.log(`❌ ${role}: Access denied (should be allowed!) - ${error.response?.status}`);
        } else {
          console.log(`❌ ${role}: Unexpected error - ${error.response?.status}`);
        }
      }
    }
  }
  
  console.log('\n=== PERMISSIONS TEST COMPLETE ===');
}

testPermissions();