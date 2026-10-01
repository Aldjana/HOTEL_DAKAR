const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testStartTask() {
  console.log('=== Test Lancement Tâche ===\n');

  // Login as admin
  console.log('1. Login as admin...');
  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.data.token;
  console.log('✅ Admin login successful\n');

  // Get pending tasks
  console.log('2. Get pending tasks...');
  const tasks = await axios.get(`${API_URL}/housekeeping`, {
    headers: { Authorization: `Bearer ${adminToken}` },
    params: { status: 'pending' }
  });
  const pendingTasks = tasks.data.data || [];
  console.log('✅ Pending tasks:', pendingTasks.length, '\n');

  if (pendingTasks.length === 0) {
    console.log('Creating a test task...');
    const rooms = await axios.get(`${API_URL}/rooms`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const firstRoom = rooms.data.data?.[0];
    
    if (firstRoom) {
      const newTask = await axios.post(`${API_URL}/housekeeping`, {
        room_id: firstRoom._id,
        task_type: 'cleaning',
        priority: 'medium',
        status: 'pending',
        notes: 'Test task'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      pendingTasks.push(newTask.data.data);
      console.log('✅ Test task created\n');
    }
  }

  // Start the first pending task
  if (pendingTasks.length > 0) {
    const taskToStart = pendingTasks[0];
    console.log('3. Start task:', taskToStart._id);
    console.log('Current status:', taskToStart.status);
    
    try {
      const updatedTask = await axios.put(`${API_URL}/housekeeping/${taskToStart._id}`, {
        status: 'in_progress'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Task started successfully');
      console.log('New status:', updatedTask.data.data.status, '\n');
    } catch (err) {
      console.log('❌ Failed to start task:', err.response?.data?.message || err.message, '\n');
    }
  }

  console.log('=== Test Complete ===');
}

testStartTask().catch(console.error);
