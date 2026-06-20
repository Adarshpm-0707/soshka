import Razorpay from 'razorpay';
import fs from 'fs';
import path from 'path';

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

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return sendResponse(res, 401, { error: 'Razorpay keys not configured' });
  }

  try {
    const body = await getRequestBody(req);
    const { amount, currency = 'INR', receipt } = body;

    const amountInt = parseInt(amount, 10);
    if (isNaN(amountInt) || amountInt < 100) {
      return sendResponse(res, 400, { error: 'Amount must be at least 100 paise' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: amountInt,
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return sendResponse(res, 200, {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    // Handle auth failures specifically if possible, or general 500 error
    if (error.statusCode === 401) {
      return sendResponse(res, 401, { error: 'Razorpay authentication failed' });
    }
    return sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}
