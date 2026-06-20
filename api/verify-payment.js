import crypto from 'crypto';
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

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return sendResponse(res, 500, { error: 'Razorpay secret key not configured' });
  }

  try {
    const body = await getRequestBody(req);
    const { order_id, payment_id, signature } = body;

    // Validate presence of required fields
    if (!order_id || !payment_id || !signature) {
      return sendResponse(res, 400, { error: 'Missing required signature verification fields' });
    }

    // Generate expected signature
    const text = order_id + '|' + payment_id;
    const generatedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    // Compare signatures
    if (generatedSignature === signature) {
      return sendResponse(res, 200, { status: 'ok', verified: true });
    } else {
      console.warn('Razorpay signature mismatch');
      return sendResponse(res, 400, { status: 'failed', error: 'Payment signature mismatch' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    return sendResponse(res, 500, { error: error.message || 'Internal server error' });
  }
}
