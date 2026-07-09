import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read credentials from .env to sign request correctly
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq !== -1) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim();
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bmbegjxfkpyenndfbcdj.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_fNj9Or2qOPMIfOtWKETgTg__5YiqUJb';

async function testInvoke() {
  console.log(`Invoking Edge Function at: ${SUPABASE_URL}/functions/v1/create-razorpay-order`);
  
  const payload = {
    items: [
      { product_id: 'db522bf5-0373-4ca2-bdc4-644784405efc', qty: 1, size: 'M' }
    ],
    shipping_address: {
      name: 'Test Customer',
      phone: '9876543210',
      email: 'test@example.com',
      addressLine: '123 Test St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001'
    }
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-razorpay-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        // No Authorization header, should return 401 Unauthorized but NOT fail to fetch!
      },
      body: JSON.stringify(payload),
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    console.log('Response Headers:');
    res.headers.forEach((val, key) => console.log(`  ${key}: ${val}`));

    const text = await res.text();
    console.log('\nResponse Body:');
    console.log(text);
  } catch (err) {
    console.error('❌ Invoke Failed:', err);
  }
}

testInvoke();
