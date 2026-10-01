const axios = require('axios');

async function testRoleAuth(email, password, expectedRole) {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email,
      password
    });
    
    const { user, token } = response.data.data;
    
    if (user.role === expectedRole) {
      console.log(`✅ ${email}: Role = ${user.role} (expected: ${expectedRole}) - CORRECT`);
    } else {
      console.log(`❌ ${email}: Role = ${user.role} (expected: ${expectedRole}) - INCORRECT`);
    }
    
    // Test token contains role
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
    
    if (payload.role === expectedRole) {
      console.log(`✅ ${email}: Token role = ${payload.role} (expected: ${expectedRole}) - CORRECT`);
    } else {
      console.log(`❌ ${email}: Token role = ${payload.role} (expected: ${expectedRole}) - INCORRECT`);
    }
    
    return { user, token };
  } catch (error) {
    console.error(`❌ Failed to login ${email}:`, error.response?.data || error.message);
    return null;
  }
}

async function testAllRoles() {
  console.log('=== TESTING ROLE AUTHENTICATION ===\n');
  
  await testRoleAuth('admin@hotel.com', 'admin123', 'admin');
  await testRoleAuth('reception@hotel.com', 'reception123', 'reception');
  await testRoleAuth('manager@hotel.com', 'manager123', 'manager');
  await testRoleAuth('housekeeping@hotel.com', 'house123', 'housekeeping');
  
  console.log('\n=== ROLE AUTHENTICATION TEST COMPLETE ===');
}

testAllRoles();