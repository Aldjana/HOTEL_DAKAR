const axios = require('axios');

async function testUsers() {
  console.log('=== TESTING USERS API (ADMIN ONLY) ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const adminToken = loginResponse.data.data.token;
  
  // Login as reception to test that they cannot access users
  const receptionLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'reception@hotel.com',
    password: 'reception123'
  });
  
  const receptionToken = receptionLogin.data.data.token;
  
  try {
    // Test GET all users as admin
    const response = await axios.get('http://localhost:3000/api/v1/auth/users', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    console.log('✅ GET /auth/users works (admin)');
    console.log('Users count:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      const firstUser = response.data.data[0];
      console.log('Sample user:', {
        id: firstUser._id,
        email: firstUser.email,
        name: `${firstUser.first_name} ${firstUser.last_name}`,
        role: firstUser.role,
        active: firstUser.is_active
      });
    }
    
    // Test that reception cannot access users
    try {
      await axios.get('http://localhost:3000/api/v1/auth/users', {
        headers: { Authorization: `Bearer ${receptionToken}` }
      });
      console.log('\n❌ Reception should not have access to users list');
    } catch (accessError) {
      if (accessError.response?.status === 403) {
        console.log('\n✅ Reception correctly denied access to users list');
      } else {
        console.log('\n⚠️  Access test failed with unexpected error:', accessError.response?.status);
      }
    }
    
    // Test create user
    const newUser = {
      email: `test${Date.now()}@hotel.com`,
      password: 'test123',
      first_name: 'Test',
      last_name: 'User',
      role: 'reception'
    };
    
    try {
      const createResponse = await axios.post('http://localhost:3000/api/v1/auth/register', newUser, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('\n✅ POST /auth/register works');
      console.log('Created user:', createResponse.data.data.email);
      
      const userId = createResponse.data.data._id;
      
      // Test get user by ID
      const userResponse = await axios.get(`http://localhost:3000/api/v1/auth/users/${userId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      console.log('\n✅ GET /auth/users/:id works');
      
      // Test update user
      try {
        const updateResponse = await axios.put(`http://localhost:3000/api/v1/auth/users/${userId}`, 
          { role: 'manager' },
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        
        console.log('\n✅ PUT /auth/users/:id works');
        console.log('Updated role:', updateResponse.data.data.role);
        
      } catch (updateError) {
        console.log('\n⚠️  Update user test failed:', updateError.response?.data?.message);
      }
      
      // Test delete user
      try {
        await axios.delete(`http://localhost:3000/api/v1/auth/users/${userId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        console.log('\n✅ DELETE /auth/users/:id works');
        
      } catch (deleteError) {
        console.log('\n⚠️  Delete user test failed:', deleteError.response?.data?.message);
      }
      
    } catch (createError) {
      console.log('\n⚠️  Create user test failed:', createError.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Users test failed:', error.response?.data || error.message);
  }
}

testUsers();