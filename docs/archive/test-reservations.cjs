const axios = require('axios');

async function testReservations() {
  console.log('=== TESTING RESERVATIONS API ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.data.token;
  
  try {
    // Test GET all reservations
    const response = await axios.get('http://localhost:3000/api/v1/reservations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ GET /reservations works');
    console.log('Reservations count:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      const firstReservation = response.data.data[0];
      console.log('Sample reservation:', {
        id: firstReservation._id,
        number: firstReservation.reservation_number,
        status: firstReservation.status,
        arrival: firstReservation.arrival_date,
        departure: firstReservation.departure_date,
        total: firstReservation.total_amount,
        paid: firstReservation.paid_amount,
        balance: firstReservation.balance_amount
      });
    }
    
    // Test get reservations by status
    const confirmedResponse = await axios.get('http://localhost:3000/api/v1/reservations/by-status?status=confirmed', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('\n✅ GET /reservations/by-status works');
    console.log('Confirmed reservations:', confirmedResponse.data.data.length);
    
    // Test create reservation (need valid client and room)
    const clientsResponse = await axios.get('http://localhost:3000/api/v1/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const roomsResponse = await axios.get('http://localhost:3000/api/v1/rooms?status=available', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (clientsResponse.data.data.length > 0 && roomsResponse.data.data.length > 0) {
      const client = clientsResponse.data.data[0];
      const room = roomsResponse.data.data[0];
      
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfterTomorrow = new Date(tomorrow);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
      
      const newReservation = {
        client_id: client._id,
        room_id: room._id,
        arrival_date: tomorrow.toISOString().split('T')[0],
        departure_date: dayAfterTomorrow.toISOString().split('T')[0],
        total_amount: 50000,
        paid_amount: 0,
        adults: 2,
        children: 0,
        status: 'confirmed',
        source: 'direct'
      };
      
      try {
        const createResponse = await axios.post('http://localhost:3000/api/v1/reservations', newReservation, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('\n✅ POST /reservations works');
        console.log('Created reservation:', createResponse.data.data.reservation_number);
        
        const reservationId = createResponse.data.data._id;
        
        // Test check-in
        try {
          const checkInResponse = await axios.post(`http://localhost:3000/api/v1/reservations/${reservationId}/check-in`, 
            { check_in_time: new Date().toISOString() },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('\n✅ POST /reservations/:id/check-in works');
          console.log('Reservation status after check-in:', checkInResponse.data.data.status);
          console.log('Room status after check-in:', checkInResponse.data.data.room_id?.status);
          
          // Test check-out
          try {
            const checkOutResponse = await axios.post(`http://localhost:3000/api/v1/reservations/${reservationId}/check-out`, 
              { check_out_time: new Date().toISOString() },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('\n✅ POST /reservations/:id/check-out works');
            console.log('Reservation status after check-out:', checkOutResponse.data.data.status);
            console.log('Room status after check-out:', checkOutResponse.data.data.room_id?.status);
            
          } catch (checkOutError) {
            console.log('\n⚠️  Check-out test failed:', checkOutError.response?.data?.message);
          }
          
        } catch (checkInError) {
          console.log('\n⚠️  Check-in test failed:', checkInError.response?.data?.message);
        }
        
        // Test generate invoice
        try {
          const invoiceResponse = await axios.get(`http://localhost:3000/api/v1/reservations/${reservationId}/invoice`, {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'arraybuffer'
          });
          
          console.log('\n✅ GET /reservations/:id/invoice works');
          console.log('Invoice PDF size:', invoiceResponse.data.length, 'bytes');
          
        } catch (invoiceError) {
          console.log('\n⚠️  Invoice generation failed:', invoiceError.response?.data?.message);
        }
        
        // Test cancel reservation
        try {
          const cancelResponse = await axios.post(`http://localhost:3000/api/v1/reservations/${reservationId}/cancel`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('\n✅ POST /reservations/:id/cancel works');
          console.log('Reservation status after cancel:', cancelResponse.data.data.status);
          
        } catch (cancelError) {
          console.log('\n⚠️  Cancel test failed:', cancelError.response?.data?.message);
        }
        
      } catch (createError) {
        console.log('\n⚠️  Create reservation test failed:', createError.response?.data?.message);
      }
    } else {
      console.log('\n⚠️  Cannot test create reservation: need valid client and available room');
    }
    
  } catch (error) {
    console.error('❌ Reservations test failed:', error.response?.data || error.message);
  }
}

testReservations();