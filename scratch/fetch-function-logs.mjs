import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function fetchLogs() {
  console.log(`Fetching Deno function boot/error logs for project ${PROJECT_REF}...`);
  
  // Try fetching logs endpoint
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/create-razorpay-order/logs?limit=20`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('Failed to fetch function logs:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log('\nFunction Logs:');
  console.log(JSON.stringify(data, null, 2));
}

fetchLogs();
