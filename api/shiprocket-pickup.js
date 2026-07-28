import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || 'warehouse';
  const channelId = process.env.SHIPROCKET_CHANNEL_ID || '11188787';

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

    // Filter out test orders
    const orderEmail = (customerEmail || shipping_address?.email || '').toLowerCase();
    const orderName = (shipping_address?.name || '').toLowerCase();
    const orderIdStr = String(orderUuid).toLowerCase();

    if (
      orderEmail.includes('test@') ||
      orderEmail.includes('example.com') ||
      orderName.includes('test customer') ||
      orderIdStr.includes('test')
    ) {
      console.log(`[Shiprocket] Excluding test order ${orderUuid} (${orderEmail}) from Shiprocket synchronization.`);
      return sendResponse(res, 200, {
        success: false,
        skipped: true,
        error: 'Test orders are excluded from Shiprocket synchronization.'
      });
    }

    // 1. Authenticate with Shiprocket
    console.log('Authenticating with Shiprocket...');
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!authRes.ok) {
      const authError = await authRes.json().catch(() => ({}));
      const errMsg = authError.message || (typeof authError.errors === 'string' ? authError.errors : '') || authRes.statusText;
      if (errMsg.toLowerCase().includes('access forbidden') || authRes.status === 403) {
        throw new Error(`Shiprocket Auth Failed: Access forbidden (Invalid email or password). Please verify your password on app.shiprocket.in and update SHIPROCKET_PASSWORD in .env.`);
      }
      throw new Error(`Shiprocket Auth Failed: ${errMsg}`);
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

    const displayOrderId = orderUuid.startsWith('00000000-0000-0000-0000-')
      ? `SOSHKA-${orderUuid.split('-').pop()}`
      : `SOSHKA-${orderUuid.slice(0, 8).toUpperCase()}`;

    // Build the Shiprocket Adhoc Order payload
    const payload = {
      order_id: displayOrderId,
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

    // 3.5 Assign AWB Code
    let warning = null;
    if (!awbCode && shipmentId) {
      console.log(`Assigning AWB code for shipment: ${shipmentId}...`);
      try {
        const awbRes = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ shipment_id: shipmentId })
        });
        const awbData = await awbRes.json();
        console.log('Shiprocket AWB assignment response:', awbData);
        if (awbData.response?.data?.awb_code) {
          awbCode = awbData.response.data.awb_code;
        } else if (awbData.awb_code) {
          awbCode = awbData.awb_code;
        } else {
          const errMsg = awbData.message || awbData.response?.data?.awb_assign_error || '';
          if (errMsg.toLowerCase().includes('recharge') || errMsg.toLowerCase().includes('wallet')) {
            warning = 'Please recharge your Shiprocket wallet (minimum ₹100 required to assign AWB courier).';
          }
        }
      } catch (awbErr) {
        console.warn('Shiprocket AWB assignment warning:', awbErr);
      }
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
    let dbUpdated = false;

    // Try Supabase JS client
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bmbegjxfkpyenndfbcdj.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { error: sbErr } = await supabase
          .from('orders')
          .update({
            shiprocket_shipment_id: String(shipmentId),
            shiprocket_awb: String(awbCode),
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', orderUuid);

        if (!sbErr) {
          dbUpdated = true;
          console.log('Order shipment metadata updated via Supabase client successfully!');
        } else {
          console.warn('Supabase client update warning:', sbErr.message);
        }
      } catch (sbEx) {
        console.warn('Supabase client exception:', sbEx.message);
      }
    }

    // Fallback to PG client if needed
    if (!dbUpdated && process.env.DATABASE_URL) {
      try {
        const dbClient = new Client({
          connectionString: process.env.DATABASE_URL,
          ssl: { rejectUnauthorized: false }
        });
        await dbClient.connect();
        await dbClient.query(`
          UPDATE public.orders
          SET shiprocket_shipment_id = $1, shiprocket_awb = $2, status = 'processing', updated_at = NOW()
          WHERE id = $3
        `, [String(shipmentId), String(awbCode), orderUuid]);
        await dbClient.end();
        dbUpdated = true;
        console.log('Order shipment metadata updated via PG client successfully!');
      } catch (pgErr) {
        console.error('PG client update error:', pgErr.message);
      }
    }

    return sendResponse(res, 200, {
      success: true,
      shipment_id: shipmentId,
      awb_code: awbCode,
      warning: warning
    });

  } catch (error) {
    console.error('Error handling Shiprocket integration:', error);
    return sendResponse(res, 500, { error: error.message || 'Internal Shiprocket server error' });
  }
}
