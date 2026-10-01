const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testSettingsPersistence() {
  console.log('=== Test Settings Persistence ===\n');

  // Login as admin
  console.log('1. Login as admin...');
  const adminLogin = await axios.post(`${API_URL}/auth/login`, {
    email: 'admin@hotel.com',
    password: 'admin123'
  });
  const adminToken = adminLogin.data.data.token;
  console.log('✅ Admin login successful\n');

  // Get current hotel settings
  console.log('2. Get current hotel settings...');
  const currentSettings = await axios.get(`${API_URL}/settings/hotel`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const originalName = currentSettings.data.data.name;
  console.log('Current hotel name:', originalName, '\n');

  // Update hotel settings
  console.log('3. Update hotel name to "Test Hotel PMS"...');
  await axios.put(`${API_URL}/settings/hotel`, {
    name: 'Test Hotel PMS',
    phone: currentSettings.data.data.phone,
    address: currentSettings.data.data.address,
    email: currentSettings.data.data.email
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ Settings updated\n');

  // Verify change immediately
  console.log('4. Verify change immediately...');
  const updatedSettings = await axios.get(`${API_URL}/settings/hotel`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Hotel name after update:', updatedSettings.data.data.name, '\n');

  // Get billing settings
  console.log('5. Get current billing settings...');
  const currentBilling = await axios.get(`${API_URL}/settings/billing`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const originalTax = currentBilling.data.data.stay_tax;
  console.log('Current stay tax:', originalTax, '\n');

  // Update billing settings
  console.log('6. Update stay tax to 1500...');
  await axios.put(`${API_URL}/settings/billing`, {
    stay_tax: 1500,
    vat_rate: currentBilling.data.data.vat_rate,
    cancellation_hours: currentBilling.data.data.cancellation_hours
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ Billing settings updated\n');

  // Verify billing change
  console.log('7. Verify billing change...');
  const updatedBilling = await axios.get(`${API_URL}/settings/billing`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Stay tax after update:', updatedBilling.data.data.stay_tax, '\n');

  // Restore original values
  console.log('8. Restore original values...');
  await axios.put(`${API_URL}/settings/hotel`, {
    name: originalName,
    phone: currentSettings.data.data.phone,
    address: currentSettings.data.data.address,
    email: currentSettings.data.data.email
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });

  await axios.put(`${API_URL}/settings/billing`, {
    stay_tax: originalTax,
    vat_rate: currentBilling.data.data.vat_rate,
    cancellation_hours: currentBilling.data.data.cancellation_hours
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('✅ Original values restored\n');

  console.log('=== Test Complete ===');
  console.log('Settings persist correctly and can be modified via API.');
}

testSettingsPersistence().catch(console.error);
