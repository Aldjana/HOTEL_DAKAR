const axios = require('axios');

async function testAuth() {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    const { user, token, refreshToken } = response.data.data;
    console.log('\n✅ User data:', user);
    console.log('✅ User role:', user.role);
    console.log('✅ Token received:', token ? 'Yes' : 'No');
    console.log('✅ Refresh token received:', refreshToken ? 'Yes' : 'No');
    
    // Test /me endpoint
    const meResponse = await axios.get('http://localhost:3000/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('\n✅ /me endpoint successful');
    console.log('User from /me:', JSON.stringify(meResponse.data.data, null, 2));
    
  } catch (error) {
    console.error('❌ Auth test failed:', error.response?.data || error.message);
  }
}

testAuth();