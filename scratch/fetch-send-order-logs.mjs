import { fileURLToPath } from 'url';
import path from 'path';

const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function fetchLogs() {
  console.log(`Fetching Deno function boot/error logs for project ${PROJECT_REF}...`);
  
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/functions/send-order-email/logs?limit=30`, {
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
  data.forEach((log) => {
    console.log(`[${log.timestamp}] [${log.level}] ${log.event_message}`);
  });
}

fetchLogs();
