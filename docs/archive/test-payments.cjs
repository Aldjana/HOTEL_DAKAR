const axios = require('axios');

async function testPayments() {
  console.log('=== TESTING PAYMENTS API ===\n');
  
  // Login as admin
  const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  
  const token = loginResponse.data.data.token;
  
  try {
    // Test GET all payments
    const response = await axios.get('http://localhost:3000/api/v1/payments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ GET /payments works');
    console.log('Payments count:', response.data.data.length);
    
    if (response.data.data.length > 0) {
      const firstPayment = response.data.data[0];
      console.log('Sample payment:', {
        id: firstPayment._id,
        amount: firstPayment.amount,
        method: firstPayment.payment_method,
        status: firstPayment.payment_status,
        date: firstPayment.payment_date
      });
    }
    
    // Test get payments by date range
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const dateRangeResponse = await axios.get('http://localhost:3000/api/v1/payments/by-date-range', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        start_date: startOfMonth.toISOString().split('T')[0],
        end_date: endOfMonth.toISOString().split('T')[0]
      }
    });
    
    console.log('\n✅ GET /payments/by-date-range works');
    console.log('Payments in date range:', dateRangeResponse.data.data.length);
    
    // Test get payment summary
    try {
      const summaryResponse = await axios.get('http://localhost:3000/api/v1/payments/summary', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('\n✅ GET /payments/summary works');
      console.log('Summary:', summaryResponse.data.data);
      
    } catch (summaryError) {
      console.log('\n⚠️  Payment summary test failed:', summaryError.response?.data?.message);
    }
    
    // Test create payment
    const reservationsResponse = await axios.get('http://localhost:3000/api/v1/reservations?status=confirmed', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (reservationsResponse.data.data.length > 0) {
      const reservation = reservationsResponse.data.data[0];
      
      const newPayment = {
        reservation_id: reservation._id,
        amount: 25000,
        payment_method: 'cash',
        payment_status: 'completed',
        payment_date: new Date().toISOString()
      };
      
      try {
        const createResponse = await axios.post('http://localhost:3000/api/v1/payments', newPayment, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('\n✅ POST /payments works');
        console.log('Created payment amount:', createResponse.data.data.amount);
        console.log('Reservation updated paid amount:', createResponse.data.data.reservation_id?.paid_amount);
        
        const paymentId = createResponse.data.data._id;
        
        // Test get payments by reservation
        const byReservationResponse = await axios.get('http://localhost:3000/api/v1/payments/by-reservation', {
          headers: { Authorization: `Bearer ${token}` },
          params: { reservationId: reservation._id }
        });
        
        console.log('\n✅ GET /payments/by-reservation works');
        console.log('Payments for reservation:', byReservationResponse.data.data.length);
        
        // Test update payment
        try {
          const updateResponse = await axios.put(`http://localhost:3000/api/v1/payments/${paymentId}`, 
            { amount: 30000 },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('\n✅ PUT /payments/:id works');
          console.log('Updated amount:', updateResponse.data.data.amount);
          
        } catch (updateError) {
          console.log('\n⚠️  Update payment test failed:', updateError.response?.data?.message);
        }
        
        // Test refund payment
        try {
          const refundResponse = await axios.post(`http://localhost:3000/api/v1/payments/${paymentId}/refund`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          console.log('\n✅ POST /payments/:id/refund works');
          console.log('Refunded payment status:', refundResponse.data.data.payment_status);
          
        } catch (refundError) {
          console.log('\n⚠️  Refund test failed:', refundError.response?.data?.message);
        }
        
      } catch (createError) {
        console.log('\n⚠️  Create payment test failed:', createError.response?.data?.message);
      }
    } else {
      console.log('\n⚠️  Cannot test create payment: need confirmed reservation');
    }
    
  } catch (error) {
    console.error('❌ Payments test failed:', error.response?.data || error.message);
  }
}

testPayments();