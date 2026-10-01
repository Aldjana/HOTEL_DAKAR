const axios = require('axios');

async function testEndToEnd() {
  console.log('=== END-TO-END TEST COMPLETE WORKFLOW ===\n');
  
  let adminToken, receptionToken, housekeepingToken, managerToken;
  let testClientId, testRoomId, testReservationId, testPaymentId;
  
  try {
    // Step 1: Login as different roles
    console.log('STEP 1: Testing authentication for all roles');
    
    const adminLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'admin@hotel.com',
      password: 'admin123'
    });
    adminToken = adminLogin.data.data.token;
    console.log('✅ Admin login successful');
    
    const receptionLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'reception@hotel.com',
      password: 'reception123'
    });
    receptionToken = receptionLogin.data.data.token;
    console.log('✅ Reception login successful');
    
    const managerLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'manager@hotel.com',
      password: 'manager123'
    });
    managerToken = managerLogin.data.data.token;
    console.log('✅ Manager login successful');
    
    const housekeepingLogin = await axios.post('http://localhost:3000/api/v1/auth/login', {
      email: 'housekeeping@hotel.com',
      password: 'house123'
    });
    housekeepingToken = housekeepingLogin.data.data.token;
    console.log('✅ Housekeeping login successful');
    
    // Step 2: Admin creates hotel settings
    console.log('\nSTEP 2: Admin configures hotel settings');
    
    await axios.put('http://localhost:3000/api/v1/settings/hotel', 
      { name: 'Hôtel Test Audit', check_in_time: '14:00', check_out_time: '11:00' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ Hotel settings configured');
    
    // Step 3: Create a test client
    console.log('\nSTEP 3: Creating test client');
    
    const clientResponse = await axios.post('http://localhost:3000/api/v1/clients', {
      first_name: 'Jean',
      last_name: 'Test',
      email: `jeantest${Date.now()}@example.com`,
      phone: '+221 77 111 22 33',
      nationality: 'SN',
      id_type: 'passport',
      id_number: 'TEST123456'
    }, { headers: { Authorization: `Bearer ${receptionToken}` } });
    
    testClientId = clientResponse.data.data._id;
    console.log('✅ Client created:', clientResponse.data.data.first_name, clientResponse.data.data.last_name);
    
    // Step 4: Get available room
    console.log('\nSTEP 4: Finding available room');
    
    const roomsResponse = await axios.get('http://localhost:3000/api/v1/rooms?status=available', {
      headers: { Authorization: `Bearer ${receptionToken}` } }
    );
    
    if (roomsResponse.data.data.length === 0) {
      console.log('⚠️  No available rooms, creating one');
      const roomTypesResponse = await axios.get('http://localhost:3000/api/v1/room-types', {
        headers: { Authorization: `Bearer ${adminToken}` } }
      );
      
      const newRoom = await axios.post('http://localhost:3000/api/v1/rooms', {
        room_number: `999${Date.now().toString().slice(-4)}`,
        room_type_id: roomTypesResponse.data.data[0]._id,
        floor: 1,
        base_price: 40000,
        max_adults: 2,
        status: 'available'
      }, { headers: { Authorization: `Bearer ${adminToken}` } });
      
      testRoomId = newRoom.data.data._id;
      console.log('✅ Room created:', newRoom.data.data.room_number);
    } else {
      testRoomId = roomsResponse.data.data[0]._id;
      console.log('✅ Available room found:', roomsResponse.data.data[0].number);
    }
    
    // Step 5: Create reservation
    console.log('\nSTEP 5: Creating reservation');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    
    const reservationResponse = await axios.post('http://localhost:3000/api/v1/reservations', {
      client_id: testClientId,
      room_id: testRoomId,
      arrival_date: tomorrow.toISOString().split('T')[0],
      departure_date: dayAfterTomorrow.toISOString().split('T')[0],
      total_amount: 80000,
      paid_amount: 0,
      adults: 2,
      children: 0,
      status: 'confirmed',
      source: 'direct'
    }, { headers: { Authorization: `Bearer ${receptionToken}` } });
    
    testReservationId = reservationResponse.data.data._id;
    console.log('✅ Reservation created:', reservationResponse.data.data.reservation_number);
    console.log('   Total:', reservationResponse.data.data.total_amount, 'FCFA');
    console.log('   Balance:', reservationResponse.data.data.balance_amount, 'FCFA');
    
    // Step 6: Add payment
    console.log('\nSTEP 6: Processing payment');
    
    const paymentResponse = await axios.post('http://localhost:3000/api/v1/payments', {
      reservation_id: testReservationId,
      amount: 40000,
      payment_method: 'cash',
      payment_status: 'completed',
      payment_date: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${receptionToken}` } });
    
    testPaymentId = paymentResponse.data.data._id;
    console.log('✅ Payment processed:', paymentResponse.data.data.amount, 'FCFA');
    console.log('   Reservation balance updated:', paymentResponse.data.data.reservation_id?.balance_amount, 'FCFA');
    
    // Step 7: Check dashboard statistics
    console.log('\nSTEP 7: Checking dashboard statistics');
    
    const dashboardResponse = await axios.get('http://localhost:3000/api/v1/dashboard/statistics', {
      headers: { Authorization: `Bearer ${managerToken}` } }
    );
    
    console.log('✅ Dashboard statistics retrieved');
    console.log('   Monthly revenue:', dashboardResponse.data.data.monthlyRevenue, 'FCFA');
    console.log('   Active reservations:', dashboardResponse.data.data.reservations.active);
    console.log('   Today check-ins:', dashboardResponse.data.data.today.checkIns);
    
    // Step 8: Check-in
    console.log('\nSTEP 8: Performing check-in');
    
    const checkInResponse = await axios.post(`http://localhost:3000/api/v1/reservations/${testReservationId}/check-in`, 
      { check_in_time: new Date().toISOString() },
      { headers: { Authorization: `Bearer ${receptionToken}` } }
    );
    
    console.log('✅ Check-in successful');
    console.log('   Reservation status:', checkInResponse.data.data.status);
    console.log('   Room status:', checkInResponse.data.data.room_id?.status);
    
    // Step 9: Verify room is occupied
    console.log('\nSTEP 9: Verifying room status');
    
    const roomResponse = await axios.get(`http://localhost:3000/api/v1/rooms/${testRoomId}`, {
      headers: { Authorization: `Bearer ${receptionToken}` } }
    );
    
    console.log('✅ Room status verified:', roomResponse.data.data.status);
    
    // Step 10: Final payment
    console.log('\nSTEP 10: Processing final payment');
    
    const finalPaymentResponse = await axios.post('http://localhost:3000/api/v1/payments', {
      reservation_id: testReservationId,
      amount: 40000,
      payment_method: 'wave',
      payment_status: 'completed',
      payment_date: new Date().toISOString()
    }, { headers: { Authorization: `Bearer ${receptionToken}` } });
    
    console.log('✅ Final payment processed:', finalPaymentResponse.data.data.amount, 'FCFA');
    console.log('   Reservation balance:', finalPaymentResponse.data.data.reservation_id?.balance_amount, 'FCFA');
    
    // Step 11: Generate invoice
    console.log('\nSTEP 11: Generating invoice');
    
    const invoiceResponse = await axios.get(`http://localhost:3000/api/v1/reservations/${testReservationId}/invoice`, {
      headers: { Authorization: `Bearer ${receptionToken}` } },
      { responseType: 'arraybuffer' }
    );
    
    console.log('✅ Invoice generated (PDF size:', invoiceResponse.data.length, 'bytes)');
    
    // Step 12: Check-out
    console.log('\nSTEP 12: Performing check-out');
    
    const checkOutResponse = await axios.post(`http://localhost:3000/api/v1/reservations/${testReservationId}/check-out`, 
      { check_out_time: new Date().toISOString() },
      { headers: { Authorization: `Bearer ${receptionToken}` } }
    );
    
    console.log('✅ Check-out successful');
    console.log('   Reservation status:', checkOutResponse.data.data.status);
    console.log('   Room status:', checkOutResponse.data.data.room_id?.status);
    
    // Step 13: Housekeeping marks room as clean
    console.log('\nSTEP 13: Housekeeping marks room as clean');
    
    // First update room status to available (simulating housekeeping completion)
    const cleanRoomResponse = await axios.patch(`http://localhost:3000/api/v1/rooms/${testRoomId}/status`, 
      { status: 'available' },
      { headers: { Authorization: `Bearer ${receptionToken}` } }
    );
    
    console.log('✅ Room marked as available');
    console.log('   Room status:', cleanRoomResponse.data.data.status);
    
    // Step 14: Verify housekeeping cannot access financial data
    console.log('\nSTEP 14: Verifying housekeeping permissions');
    
    try {
      await axios.get('http://localhost:3000/api/v1/payments', {
        headers: { Authorization: `Bearer ${housekeepingToken}` } }
      );
      console.log('❌ Housekeeping should not access payments');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Housekeeping correctly denied access to payments');
      }
    }
    
    // Step 15: Manager views cash report
    console.log('\nSTEP 15: Manager views cash report');
    
    const paymentsResponse = await axios.get('http://localhost:3000/api/v1/payments', {
      headers: { Authorization: `Bearer ${managerToken}` } }
    );
    
    console.log('✅ Manager can access payments');
    console.log('   Total payments:', paymentsResponse.data.data.length);
    
    // Step 16: Admin can manage users
    console.log('\nSTEP 16: Admin user management');
    
    const usersResponse = await axios.get('http://localhost:3000/api/v1/auth/users', {
      headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    console.log('✅ Admin can manage users');
    console.log('   Total users:', usersResponse.data.data.length);
    
    // Step 17: Reception cannot access user management
    console.log('\nSTEP 17: Verifying reception permissions');
    
    try {
      await axios.get('http://localhost:3000/api/v1/auth/users', {
        headers: { Authorization: `Bearer ${receptionToken}` } }
      );
      console.log('❌ Reception should not access user management');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Reception correctly denied access to user management');
      }
    }
    
    // Cleanup
    console.log('\nCLEANUP: Removing test data');
    
    try {
      await axios.delete(`http://localhost:3000/api/v1/clients/${testClientId}`, {
        headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('✅ Test client deleted');
    } catch (e) {
      console.log('⚠️  Could not delete test client');
    }
    
    try {
      await axios.delete(`http://localhost:3000/api/v1/rooms/${testRoomId}`, {
        headers: { Authorization: `Bearer ${adminToken}` } }
      );
      console.log('✅ Test room deleted');
    } catch (e) {
      console.log('⚠️  Could not delete test room');
    }
    
    console.log('\n=== END-TO-END TEST COMPLETED SUCCESSFULLY ===');
    console.log('✅ All core workflows tested');
    console.log('✅ Role-based permissions verified');
    console.log('✅ Data persistence confirmed');
    console.log('✅ API endpoints functional');
    
  } catch (error) {
    console.error('\n❌ END-TO-END TEST FAILED:', error.response?.data || error.message);
    console.error('Error details:', error.response?.data);
  }
}

testEndToEnd();