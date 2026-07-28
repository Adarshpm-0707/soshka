import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
let email = '';
let password = '';
let pickupLocation = 'warehouse';

for (const line of envContent.split('\n')) {
  if (line.startsWith('SHIPROCKET_EMAIL=')) {
    email = line.replace('SHIPROCKET_EMAIL=', '').trim();
  }
  if (line.startsWith('SHIPROCKET_PASSWORD=')) {
    password = line.replace('SHIPROCKET_PASSWORD=', '').trim();
  }
  if (line.startsWith('SHIPROCKET_PICKUP_LOCATION=')) {
    pickupLocation = line.replace('SHIPROCKET_PICKUP_LOCATION=', '').trim();
  }
}

console.log(`Testing Shiprocket with Email: ${email}, Pickup Location: ${pickupLocation}`);

async function testCreateOrder() {
  try {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { token } = await authRes.json();
    console.log("Authentication successful! Token received.");

    const testPayload = {
      order_id: `SOSHKA-TEST${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pickup_location: pickupLocation,
      channel_id: 11188787,
      billing_customer_name: "Test",
      billing_last_name: "Customer",
      billing_address: "2nd floor Mufeeda Complex",
      billing_city: "Kannur",
      billing_pincode: 670001,
      billing_state: "Kerala",
      billing_country: "India",
      billing_email: "test@soshka.in",
      billing_phone: "9496465949",
      shipping_is_billing: true,
      order_items: [
        {
          name: "Test Jewelry Item",
          sku: "TEST-SKU",
          units: 1,
          selling_price: 100
        }
      ],
      payment_method: "Prepaid",
      sub_total: 100,
      length: 10,
      breadth: 10,
      height: 5,
      weight: 0.2
    };

    const createRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(testPayload)
    });

    console.log("Create Order HTTP Status:", createRes.status);
    const data = await createRes.json();
    console.log("Create Order Response:", JSON.stringify(data, null, 2));

  } catch (err) {
    console.error("Test Error:", err);
  }
}

testCreateOrder();
