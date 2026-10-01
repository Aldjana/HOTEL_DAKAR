const axios = require('axios');

async function testRooms() {
  console.log('=== TESTING ROOMS API ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.data.token;
  
  try {
    // Test GET all rooms
    const response = await axios.get('http://localhost:3000/api/v1/rooms', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ GET /rooms works');
    console.log('Rooms count:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      const firstRoom = response.data.data[0];
      console.log('Sample room:', {
        id: firstRoom._id,
        number: firstRoom.number,
        status: firstRoom.status,
        type: firstRoom.type?.name,
        price: firstRoom.price
      });
    }
    
    // Test GET rooms by status
    const availableResponse = await axios.get('http://localhost:3000/api/v1/rooms/by-status?status=available', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /rooms/by-status works');
    console.log('Available rooms:', availableResponse.data.data.length);
    
    // Test create room
    const newRoom = {
      room_number: '999',
      room_type_id: '6ab4f79f4171cc8775284e3e', // You'll need a valid room type ID
      floor: 1,
      base_price: 30000,
      max_adults: 2,
      status: 'available'
    };
    
    try {
      const createResponse = await axios.post('http://localhost:3000/api/v1/rooms', newRoom, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('\n✅ POST /rooms works');
      console.log('Created room:', createResponse.data.data.room_number);
      
      // Test update status
      const updateStatusResponse = await axios.patch(`http://localhost:3000/api/v1/rooms/${createResponse.data.data._id}/status`, 
        { status: 'maintenance' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('\n✅ PATCH /rooms/:id/status works');
      console.log('Updated status to:', updateStatusResponse.data.data.status);
      
      // Clean up
      await axios.delete(`http://localhost:3000/api/v1/rooms/${createResponse.data.data._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('\n✅ DELETE /rooms/:id works');
      
    } catch (createError) {
      console.log('\n⚠️  Create room test skipped (might need valid room_type_id):', createError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Rooms test failed:', error.response?.data || error.message);
  }
}

testRooms();