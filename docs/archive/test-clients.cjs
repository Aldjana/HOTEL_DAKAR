const axios = require('axios');

async function testClients() {
  console.log('=== TESTING CLIENTS API ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.data.token;
  
  try {
    // Test GET all clients
    const response = await axios.get('http://localhost:3000/api/v1/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ GET /clients works');
    console.log('Clients count:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      const firstClient = response.data.data[0];
      console.log('Sample client:', {
        id: firstClient._id,
        name: `${firstClient.first_name} ${firstClient.last_name}`,
        email: firstClient.email,
        phone: firstClient.phone
      });
    }
    
    // Test search clients
    const searchResponse = await axios.get('http://localhost:3000/api/v1/clients/search?q=awa', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /clients/search works');
    console.log('Search results:', searchResponse.data.data.length);
    
    // Test create client
    const newClient = {
      first_name: 'Test',
      last_name: 'Client',
      email: `test${Date.now()}@example.com`,
      phone: '+221 77 000 00 00',
      nationality: 'Sénégal',
      id_type: 'passport',
      id_number: 'A1234567'
    };
    
    const createResponse = await axios.post('http://localhost:3000/api/v1/clients', newClient, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ POST /clients works');
    console.log('Created client:', createResponse.data.data.first_name, createResponse.data.data.last_name);
    
    // Test get client by ID
    const clientResponse = await axios.get(`http://localhost:3000/api/v1/clients/${createResponse.data.data._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /clients/:id works');
    
    // Test update client
    const updateResponse = await axios.put(`http://localhost:3000/api/v1/clients/${createResponse.data.data._id}`, 
      { phone: '+221 77 999 99 99' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('\n✅ PUT /clients/:id works');
    console.log('Updated phone:', updateResponse.data.data.phone);
    
    // Test missing endpoints
    try {
      await axios.get(`http://localhost:3000/api/v1/clients/${createResponse.data.data._id}/reservations`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('\n✅ GET /clients/:id/reservations works');
    } catch (error) {
      console.log('\n❌ GET /clients/:id/reservations MISSING - Frontend expects this endpoint');
    }
    
    try {
      await axios.get(`http://localhost:3000/api/v1/clients/${createResponse.data.data._id}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ GET /clients/:id/history works');
    } catch (error) {
      console.log('❌ GET /clients/:id/history MISSING - Frontend expects this endpoint');
    }
    
    // Clean up
    await axios.delete(`http://localhost:3000/api/v1/clients/${createResponse.data.data._id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ DELETE /clients/:id works');
    
  } catch (error) {
    console.error('❌ Clients test failed:', error.response?.data || error.message);
  }
}

testClients();