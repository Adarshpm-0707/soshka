import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Helper to load fallback environment variables locally
function loadEnvFallback() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading fallback .env:', err);
  }
}

// Helper to parse request body
async function getRequestBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper to send JSON responses
function sendResponse(res, statusCode, data) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  loadEnvFallback();

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary';
  const channelId = process.env.SHIPROCKET_CHANNEL_ID;

  if (!email || !password || email === 'your-shiprocket-email@domain.com') {
    console.warn('Shiprocket credentials are missing or default placeholders.');
    return sendResponse(res, 400, {
      error: 'Shiprocket credentials are not configured. Please update SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your .env file.'
    });
  }

  try {
    const body = await getRequestBody(req);
    const { order, email: customerEmail } = body;

    if (!order || !order.id || !order.shipping_address || !order.items) {
      return sendResponse(res, 400, { error: 'Missing order details' });
    }

    const { shipping_address, items, total, id: orderUuid } = order;

    // 1. Authenticate with Shiprocket
    console.log('Authenticating with Shiprocket...');
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!authRes.ok) {
      const authError = await authRes.json();
      throw new Error(`Shiprocket auth failed: ${authError.message || authRes.statusText}`);
    }

    const { token } = await authRes.json();
    console.log('Shiprocket authenticated successfully.');

    // 2. Format order date
    const orderDate = new Date(order.created_at || Date.now())
      .toISOString()
      .replace('T', ' ')
      .slice(0, 16);

    // Split name into first and last
    const nameParts = (shipping_address.name || 'Customer').trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '.';

    // Format items
    const orderItems = items.map((item, idx) => ({
      name: item.name || `Jewelry Item ${idx + 1}`,
      sku: item.product_id ? item.product_id.slice(0, 8) : `SKU-${idx}`,
      units: parseInt(item.quantity || '1', 10),
      selling_price: parseFloat(item.price || '0')
    }));

    // Build the Shiprocket Adhoc Order payload
    const payload = {
      order_id: orderUuid.slice(0, 20), // Max 20 characters for typical Shiprocket ID
      order_date: orderDate,
      pickup_location: pickupLocation,
      channel_id: channelId ? parseInt(channelId, 10) : undefined,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shipping_address.addressLine || shipping_address.address || 'Address Line 1',
      billing_city: shipping_address.city || 'City',
      billing_pincode: parseInt(shipping_address.postalCode || '110001', 10),
      billing_state: shipping_address.state || 'State',
      billing_country: 'India',
      billing_email: customerEmail || 'customer@soshka.in',
      billing_phone: shipping_address.phone ? shipping_address.phone.replace(/[^0-9]/g, '') : '9876543210',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: 'Prepaid',
      sub_total: parseFloat(total || '0'),
      length: 10, // cm (default package box size)
      breadth: 10,  // cm
      height: 5,  // cm
      weight: 0.2 // kg
    };

    // 3. Create the order in Shiprocket
    console.log('Sending order payload to Shiprocket...');
    const createOrderRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!createOrderRes.ok) {
      const createErrorMsg = await createOrderRes.text();
      console.error('Shiprocket order creation error response:', createErrorMsg);
      throw new Error(`Shiprocket order creation failed: ${createErrorMsg}`);
    }

    const createData = await createOrderRes.json();
    console.log('Shiprocket order created:', createData);

    let shipmentId = null;
    let awbCode = '';

    if (createData.shipment_id) {
      shipmentId = createData.shipment_id;
      awbCode = createData.awb_code || '';
    } else if (createData.data && createData.data.shipment_id) {
      shipmentId = createData.data.shipment_id;
      awbCode = createData.data.awb_code || '';
    } else if (createData.data && createData.data.data && Array.isArray(createData.data.data) && createData.data.data[0]) {
      shipmentId = createData.data.data[0].shipment_id;
      awbCode = createData.data.data[0].awb_code || '';
    } else if (createData.data && Array.isArray(createData.data) && createData.data[0]) {
      shipmentId = createData.data[0].shipment_id;
      awbCode = createData.data[0].awb_code || '';
    }

    if (!shipmentId) {
      if (createData.message) {
        throw new Error(`Shiprocket order creation failed: ${createData.message}`);
      }
      throw new Error(`Shiprocket did not return a shipment ID. Response: ${JSON.stringify(createData)}`);
    }

    // 4. Schedule courier pickup
    console.log(`Scheduling pickup for shipment: ${shipmentId}...`);
    const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        shipment_id: [shipmentId]
      })
    });

    if (!pickupRes.ok) {
      const pickupError = await pickupRes.text();
      console.warn('Shiprocket pickup scheduling warning (might need manually approved/re-scheduled):', pickupError);
    } else {
      const pickupData = await pickupRes.json();
      console.log('Shiprocket pickup scheduled successfully:', pickupData);
    }

    // 5. Save shipment metadata in Supabase
    console.log('Saving shipment details in local database...');
    const pgConnectionString = process.env.DATABASE_URL;
    if (!pgConnectionString) {
      throw new Error('DATABASE_URL is not configured in the environment.');
    }
    const dbClient = new Client({
      connectionString: pgConnectionString,
      ssl: { rejectUnauthorized: false }
    });

    await dbClient.connect();
    
    await dbClient.query(`
      UPDATE public.orders
      SET shiprocket_shipment_id = $1, shiprocket_awb = $2
      WHERE id = $3
    `, [String(shipmentId), String(awbCode), orderUuid]);

    await dbClient.end();
    console.log('Order shipment metadata updated in database successfully!');

    return sendResponse(res, 200, {
      success: true,
      shipment_id: shipmentId,
      awb_code: awbCode
    });

  } catch (error) {
    console.error('Error handling Shiprocket integration:', error);
    return sendResponse(res, 500, { error: error.message || 'Internal Shiprocket server error' });
  }
}
