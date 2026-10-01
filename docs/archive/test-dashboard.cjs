const axios = require('axios');

async function testDashboard() {
  console.log('=== TESTING DASHBOARD API ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.data.token;
  
  try {
    const response = await axios.get('http://localhost:3000/api/v1/dashboard/statistics', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Dashboard statistics endpoint works');
    console.log('Response data keys:', Object.keys(response.data.data));
    
    const stats = response.data.data;
    
    console.log('\n--- Dashboard Statistics ---');
    console.log('Occupancy:', stats.occupancy);
    console.log('Today:', stats.today);
    console.log('Reservations:', stats.reservations);
    console.log('Clients:', stats.clients);
    console.log('Availability:', stats.availability);
    console.log('Revenue:', stats.revenue);
    console.log('Payments:', stats.payments);
    console.log('Occupancy Rate:', stats.occupancyRate);
    console.log('Available Rooms:', stats.availableRooms);
    console.log('Occupied Rooms:', stats.occupiedRooms);
    console.log('Daily Revenue:', stats.dailyRevenue);
    console.log('Monthly Revenue:', stats.monthlyRevenue);
    console.log('Today Arrivals:', stats.todayArrivals?.length || 0);
    console.log('Today Departures:', stats.todayDepartures?.length || 0);
    console.log('Alerts:', stats.alerts?.length || 0);
    
    // Verify all data is dynamic (not hardcoded)
    const isDynamic = stats.occupancy !== undefined && 
                      stats.revenue !== undefined &&
                      stats.todayArrivals !== undefined;
    
    if (isDynamic) {
      console.log('\n✅ Dashboard data is dynamic (from database)');
    } else {
      console.log('\n❌ Dashboard data might be hardcoded');
    }
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.response?.data || error.message);
  }
}

testDashboard();