import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
let email = '';
let password = '';
let pickupLocation = 'warehouse';
let channelId = '11188787';

for (const line of envContent.split('\n')) {
  if (line.startsWith('SHIPROCKET_EMAIL=')) {
    email = line.replace('SHIPROCKET_EMAIL=', '').trim();
  }
  if (line.startsWith('SHIPROCKET_PASSWORD=')) {
    password = line.replace('SHIPROCKET_PASSWORD=', '').trim();
  }
}

async function testFullShiprocketFlow() {
  try {
    // 1. Login
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const { token } = await authRes.json();
    console.log("1. Authenticated successfully!");

    // 2. Create Order
    const testPayload = {
      order_id: `SOSHKA-TEST-AWB-${Date.now().toString().slice(-6)}`,
      order_date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pickup_location: pickupLocation,
      channel_id: parseInt(channelId, 10),
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

    const createData = await createRes.json();
    console.log("2. Order Created:", createData);

    const shipmentId = createData.shipment_id || createData.data?.shipment_id;
    let awbCode = createData.awb_code || createData.data?.awb_code || '';

    console.log(`Shipment ID: ${shipmentId}, Initial AWB: "${awbCode}"`);

    // 3. Assign AWB Code if not already assigned
    if (!awbCode && shipmentId) {
      console.log(`Assigning AWB code for shipment ${shipmentId}...`);
      const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id: shipmentId })
      });

      const awbData = await awbRes.json();
      console.log("3. AWB Assignment Response:", JSON.stringify(awbData, null, 2));

      if (awbData.response?.data?.awb_code) {
        awbCode = awbData.response.data.awb_code;
      } else if (awbData.awb_code) {
        awbCode = awbData.awb_code;
      }
    }

    // 4. Generate Pickup
    if (shipmentId) {
      console.log(`4. Generating pickup for shipment ${shipmentId}...`);
      const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ shipment_id: [parseInt(shipmentId, 10)] })
      });

      const pickupData = await pickupRes.json();
      console.log("Pickup Response:", JSON.stringify(pickupData, null, 2));
    }

  } catch (err) {
    console.error("Test Error:", err);
  }
}

testFullShiprocketFlow();
