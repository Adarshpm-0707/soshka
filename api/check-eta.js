import fs from 'fs';
import path from 'path';

// Module-level token cache and cooldown handling
let cachedToken = null;
let tokenExpiresAt = 0;
let authBlockedUntil = 0;

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

// Standard fallback delivery estimator for Indian pincodes
function getFallbackDeliveryEstimate(pincode) {
  const pinStr = String(pincode || '').trim();
  const pinNum = parseInt(pinStr, 10);
  if (isNaN(pinNum) || pinStr.length !== 6 || pinNum < 100000 || pinNum > 999999) {
    return { serviceable: false, message: 'Invalid pincode. Must be a 6-digit Indian postal code.' };
  }
  
  // Kannur / Kerala pincodes (starting with 67, 68, 69): 1-3 days
  if (pinStr.startsWith('67') || pinStr.startsWith('68') || pinStr.startsWith('69')) {
    return {
      serviceable: true,
      delivery_days: '1 to 3',
      courier_name: 'Express Local Courier'
    };
  }
  
  // South India (starting with 5, 6): 2-4 days
  if (pinStr.startsWith('5') || pinStr.startsWith('6')) {
    return {
      serviceable: true,
      delivery_days: '2 to 4',
      courier_name: 'Express Regional Courier'
    };
  }
  
  // Rest of India: 3-5 days
  return {
    serviceable: true,
    delivery_days: '3 to 5',
    courier_name: 'Standard National Express'
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  loadEnvFallback();

  try {
    let pincode = '';
    if (req.method === 'POST') {
      const body = await getRequestBody(req);
      pincode = body.pincode;
    } else {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      pincode = url.searchParams.get('pincode');
    }

    pincode = String(pincode || '').trim();

    if (!pincode || pincode.length !== 6 || isNaN(Number(pincode))) {
      return sendResponse(res, 400, { serviceable: false, error: 'Invalid 6-digit pincode' });
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;
    const pickupPostcode = "670001";

    if (!email || !password || email.includes('your-shiprocket')) {
      return sendResponse(res, 200, getFallbackDeliveryEstimate(pincode));
    }

    // Check if Shiprocket auth is currently in cooldown (e.g. rate limited or blocked)
    if (Date.now() < authBlockedUntil) {
      return sendResponse(res, 200, getFallbackDeliveryEstimate(pincode));
    }

    let token = cachedToken;
    const now = Date.now();

    // Authenticate with Shiprocket if we don't have a valid cached token
    if (!token || now >= tokenExpiresAt) {
      const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!authRes.ok) {
        const authErr = await authRes.json().catch(() => ({}));
        console.warn('[check-eta] Shiprocket auth temporarily unavailable/blocked. Using estimated delivery calculation. Error:', authErr.message || authErr);
        // Set a 15 minute cooldown before trying to login to Shiprocket again to prevent repeat block
        authBlockedUntil = now + 15 * 60 * 1000;
        return sendResponse(res, 200, getFallbackDeliveryEstimate(pincode));
      }

      const authData = await authRes.json();
      token = authData.token;
      if (token) {
        cachedToken = token;
        // Shiprocket tokens last ~10 days, we cache for 24 hours
        tokenExpiresAt = now + 24 * 60 * 60 * 1000;
      }
    }

    if (!token) {
      return sendResponse(res, 200, getFallbackDeliveryEstimate(pincode));
    }

    // Fetch serviceability
    const serviceabilityUrl = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${pincode}&weight=0.5&cod=1`;
    const servRes = await fetch(serviceabilityUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!servRes.ok) {
      if (servRes.status === 401) {
        // Token expired
        cachedToken = null;
        tokenExpiresAt = 0;
      }
      return sendResponse(res, 200, getFallbackDeliveryEstimate(pincode));
    }

    const servData = await servRes.json();
    const courierList = servData?.data?.available_courier_companies || [];

    if (courierList.length === 0) {
      return sendResponse(res, 200, { serviceable: false, message: 'Delivery not available to this pincode.' });
    }

    const validCouriers = courierList
      .filter(c => c.estimated_delivery_days !== undefined || c.etd !== undefined)
      .map(c => {
        let days = parseInt(c.estimated_delivery_days || '0', 10);
        if (days === 0 && c.etd) {
          const etdDate = new Date(c.etd).getTime();
          const today = new Date().getTime();
          const diffMs = etdDate - today;
          days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
        return {
          courier_name: c.courier_name || c.name || 'Express Courier',
          delivery_days: days
        };
      })
      .sort((a, b) => a.delivery_days - b.delivery_days);

    if (validCouriers.length === 0) {
      return sendResponse(res, 200, { serviceable: false, message: 'Delivery not available to this pincode.' });
    }

    const fastestCourier = validCouriers[0];
    const minDays = fastestCourier.delivery_days || 3;
    const maxDays = minDays + 2;

    return sendResponse(res, 200, {
      serviceable: true,
      delivery_days: `${minDays} to ${maxDays}`,
      courier_name: fastestCourier.courier_name
    });

  } catch (err) {
    console.error('[check-eta] Error handling ETA check:', err);
    return sendResponse(res, 200, getFallbackDeliveryEstimate(req.body?.pincode || '670001'));
  }
}
