/**
 * deploy-edge-functions.mjs
 * 
 * Deploys all three Edge Functions to Supabase using the Management API.
 * Run: node scratch/deploy-edge-functions.mjs
 * 
 * Requires: SUPABASE_ACCESS_TOKEN set in environment or .env.local
 * Get your token from: https://supabase.com/dashboard/account/tokens
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';

// Load env
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const envPath = path.join(__dirname, '..', file);
    if (fs.existsSync(envPath)) {
      const lines = fs.readFileSync(envPath, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eq = trimmed.indexOf('=');
          if (eq !== -1) {
            const key = trimmed.slice(0, eq).trim();
            const val = trimmed.slice(eq + 1).trim();
            if (!process.env[key]) process.env[key] = val;
          }
        }
      }
    }
  }
}
loadEnv();

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN is not set.');
  console.error('   Get your token at: https://supabase.com/dashboard/account/tokens');
  console.error('   Then run: $env:SUPABASE_ACCESS_TOKEN="your_token" and re-run this script.');
  console.error('   Or add SUPABASE_ACCESS_TOKEN=your_token to .env.local');
  process.exit(1);
}

const BASE_URL = `https://api.supabase.com/v1/projects/${PROJECT_REF}`;
const HEADERS = {
  'Authorization': `Bearer ${ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

// Functions to deploy
const FUNCTIONS = [
  'create-razorpay-order',
  'verify-razorpay-payment',
  'create-shiprocket-order',
];

// Secrets to set
const SECRETS = {
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
  SHIPROCKET_EMAIL: process.env.SHIPROCKET_EMAIL,
  SHIPROCKET_PASSWORD: process.env.SHIPROCKET_PASSWORD,
  SHIPROCKET_PICKUP_LOCATION: process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary',
  SHIPROCKET_CHANNEL_ID: process.env.SHIPROCKET_CHANNEL_ID,
};

async function setSecrets() {
  console.log('\n📦 Setting Supabase secrets...');
  const secretsList = Object.entries(SECRETS).map(([name, value]) => ({ name, value }));

  const res = await fetch(`${BASE_URL}/secrets`, {
    method: 'POST',
    headers: HEADERS,
    body: JSON.stringify(secretsList),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to set secrets: ${err}`);
  }

  console.log(`  ✅ Set ${secretsList.length} secrets successfully`);
}

async function deployFunction(fnName) {
  const fnPath = path.join(__dirname, '..', 'supabase', 'functions', fnName, 'index.ts');
  
  if (!fs.existsSync(fnPath)) {
    console.error(`  ❌ Function file not found: ${fnPath}`);
    return;
  }

  const source = fs.readFileSync(fnPath, 'utf8');

  console.log(`\n🚀 Deploying function: ${fnName}...`);

  // Check if function exists first
  const checkRes = await fetch(`${BASE_URL}/functions/${fnName}`, { headers: HEADERS });
  
  if (checkRes.ok) {
    // Update existing function
    const res = await fetch(`${BASE_URL}/functions/${fnName}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({
        body: source,
        verify_jwt: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ Failed to update ${fnName}: ${err}`);
      return;
    }
    console.log(`  ✅ Updated: ${fnName}`);
  } else {
    // Create new function
    const res = await fetch(`${BASE_URL}/functions`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        slug: fnName,
        name: fnName,
        body: source,
        verify_jwt: true,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  ❌ Failed to create ${fnName}: ${err}`);
      return;
    }
    console.log(`  ✅ Created: ${fnName}`);
  }
}

async function main() {
  console.log('🔧 Supabase Edge Function Deployer');
  console.log(`   Project: ${PROJECT_REF}`);
  
  try {
    await setSecrets();
    
    for (const fnName of FUNCTIONS) {
      await deployFunction(fnName);
    }

    console.log('\n✅ All Edge Functions deployed successfully!');
    console.log(`\n🌐 Function URLs:`);
    for (const fnName of FUNCTIONS) {
      console.log(`   https://${PROJECT_REF}.supabase.co/functions/v1/${fnName}`);
    }
  } catch (err) {
    console.error('\n❌ Deployment failed:', err.message);
    process.exit(1);
  }
}

main();
