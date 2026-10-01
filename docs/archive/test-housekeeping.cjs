const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testHousekeeping() {
  console.log('=== Test Module Ménage ===\n');

  // Login as housekeeping
  console.log('1. Login as housekeeping...');
  try {
    const login = await axios.post(`${API_URL}/auth/login`, {
      email: 'housekeeping@hotel.com',
      password: 'housekeeping123'
    });
    const token = login.data.data.token;
    console.log('✅ Housekeeping login successful\n');
  } catch (err) {
    console.log('❌ Housekeeping login failed, trying admin...');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    const token = adminLogin.data.data.token;
    console.log('✅ Admin login successful\n');
  }

  // Login as admin for tests
  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.data.token;

  // Get statistics
  console.log('2. Get housekeeping statistics...');
  try {
    const stats = await axios.get(`${API_URL}/housekeeping/statistics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Statistics:', JSON.stringify(stats.data.data, null, 2), '\n');
  } catch (err) {
    console.log('❌ Failed:', err.response?.data?.message, '\n');
  }

  // Get all tasks
  console.log('3. Get all housekeeping tasks...');
  try {
    const tasks = await axios.get(`${API_URL}/housekeeping`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Tasks count:', tasks.data.data?.length || 0, '\n');
  } catch (err) {
    console.log('❌ Failed:', err.response?.data?.message, '\n');
  }

  // Get rooms
  console.log('4. Get all rooms...');
  try {
    const rooms = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const roomStats = {
      total: rooms.data.data?.length || 0,
      cleaning: rooms.data.data?.filter(r => r.status === 'cleaning').length || 0,
      available: rooms.data.data?.filter(r => r.status === 'available').length || 0,
      maintenance: rooms.data.data?.filter(r => r.status === 'maintenance').length || 0,
    };
    console.log('✅ Room stats:', JSON.stringify(roomStats, null, 2), '\n');
  } catch (err) {
    console.log('❌ Failed:', err.response?.data?.message, '\n');
  }

  // Create a sample task
  console.log('5. Create a sample housekeeping task...');
  try {
    const rooms = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const firstRoom = rooms.data.data?.[0];
    
    if (firstRoom) {
      const task = await axios.post(`${API_URL}/housekeeping`, {
        room_id: firstRoom._id,
        task_type: 'cleaning',
        priority: 'medium',
        status: 'pending',
        notes: 'Test task from automated test'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Task created:', task.data.data._id, '\n');
      
      // Complete the task
      console.log('6. Complete the task...');
      await axios.post(`${API_URL}/housekeeping/${task.data.data._id}/complete`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Task completed\n');
    } else {
      console.log('⚠️ No rooms found to create task\n');
    }
  } catch (err) {
    console.log('❌ Failed:', err.response?.data?.message, '\n');
  }

  console.log('=== Test Complete ===');
}

testHousekeeping().catch(console.error);
