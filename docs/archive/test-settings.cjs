const axios = require('axios');

async function testSettings() {
  console.log('=== TESTING SETTINGS API ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.data.token;
  
  try {
    // Test GET hotel settings
    const hotelResponse = await axios.get('http://localhost:3000/api/v1/settings/hotel', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ GET /settings/hotel works');
    console.log('Hotel settings:', hotelResponse.data.data);
    
    // Test GET reservation sources
    const sourcesResponse = await axios.get('http://localhost:3000/api/v1/settings/reservation-sources', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /settings/reservation-sources works');
    console.log('Reservation sources:', sourcesResponse.data.data);
    
    // Test GET payment modes
    const paymentModesResponse = await axios.get('http://localhost:3000/api/v1/payment-modes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /payment-modes works');
    console.log('Payment modes:', paymentModesResponse.data.data);
    
    // Test GET room types
    const roomTypesResponse = await axios.get('http://localhost:3000/api/v1/room-types', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /room-types works');
    console.log('Room types:', roomTypesResponse.data.data);
    
    // Test that reception cannot access settings
    const receptionLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'reception@hotel.com',
      password: 'reception123'
    });
    
    const receptionToken = receptionLogin.data.data.token;
    
    try {
      await axios.get('http://localhost:3000/api/v1/settings/hotel', {
        headers: { Authorization: `Bearer ${receptionToken}` }
      });
      console.log('\n❌ Reception should not have access to hotel settings');
    } catch (accessError) {
      if (accessError.response?.status === 403) {
        console.log('\n✅ Reception correctly denied access to hotel settings');
      } else {
        console.log('\n⚠️  Access test failed with unexpected error:', accessError.response?.status);
      }
    }
    
    // Test update hotel settings
    try {
      const updateResponse = await axios.put('http://localhost:3000/api/v1/settings/hotel', 
        { name: 'Test Hotel Updated', check_in_time: '14:00', check_out_time: '11:00' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('\n✅ PUT /settings/hotel works');
      console.log('Updated hotel name:', updateResponse.data.data.name);
      
    } catch (updateError) {
      console.log('\n⚠️  Update hotel settings test failed:', updateError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Settings test failed:', error.response?.data || error.message);
  }
}

testSettings();