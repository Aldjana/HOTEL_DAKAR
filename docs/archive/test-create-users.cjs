const axios = require('axios');

async function createTestUsers() {
  const adminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhYjRmNzlmNDE3MWNjODc3NTI4NGUzZCIsImVtYWlsIjoiYWRtaW5AaG90ZWwuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzkwNjc3MjU1LCJleHAiOjE3OTEyODIwNTV9.tYwj5Yj_4FbKqQH24IaoEOUfxeOpgYGlhiPAbwCIRfg';
  
  const users = [
    {
      email: 'reception@hotel.com',
      password: 'reception123',
      first_name: 'Awa',
      last_name: 'Diop',
      role: 'reception'
    },
    {
      email: 'manager@hotel.com',
      password: 'manager123',
      first_name: 'Moussa',
      last_name: 'Fall',
      role: 'manager'
    },
    {
      email: 'housekeeping@hotel.com',
      password: 'house123',
      first_name: 'Fatou',
      last_name: 'Sow',
      role: 'housekeeping'
    }
  ];

  for (const userData of users) {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/auth/register', userData, {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      
      console.log(`✅ User created: ${userData.email} (${userData.role})`);
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('existe déjà')) {
        console.log(`ℹ️  User already exists: ${userData.email} (${userData.role})`);
      } else {
        console.error(`❌ Failed to create user ${userData.email}:`, error.response?.data || error.message);
      }
    }
  }
}

createTestUsers();