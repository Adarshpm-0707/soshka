
async function test() {
  const email = 'soshka.api@gmail.com';
  const password = 'm^$FXc0dcZrRTk7vn4qsQsHDYe@3UO^y';
  
  console.log('Authenticating...');
  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const authData = await authRes.json();
  console.log('Auth response:', authData);
  const token = authData.token;
  
  const orderUuid = 'test-' + Date.now();
  const payload = {
    order_id: orderUuid.slice(0, 20),
    order_date: '2026-07-03 15:15',
    pickup_location: 'Primary',
    channel_id: 11188787,
    billing_customer_name: 'Test',
    billing_last_name: 'Customer',
    billing_address: 'Test Address Line 1',
    billing_city: 'Kannur',
    billing_pincode: 670001,
    billing_state: 'Kerala',
    billing_country: 'India',
    billing_email: 'soshka.in@gmail.com',
    billing_phone: '9876543210',
    shipping_is_billing: true,
    order_items: [
      {
        name: 'Test Item',
        sku: 'TEST-SKU',
        units: 1,
        selling_price: 100
      }
    ],
    payment_method: 'Prepaid',
    sub_total: 100,
    length: 10,
    breadth: 10,
    height: 5,
    weight: 0.2
  };
  
  console.log('Creating order with payload:', payload);
  const createOrderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  
  const createData = await createOrderRes.json();
  console.log('Raw create response:', JSON.stringify(createData, null, 2));
}

test().catch(err => console.error(err));
