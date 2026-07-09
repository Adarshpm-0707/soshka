const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function fetchLogs() {
  console.log(`Fetching Deno function logs for project ${PROJECT_REF} via analytics/endpoints/logs...`);
  
  // Try calling the correct analytics endpoint
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs?source=edge_logs&iso_timestamp_start=${encodeURIComponent(oneHourAgo)}&limit=30`;
  
  const res = await fetch(url, {
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
  if (data.result && Array.isArray(data.result)) {
    data.result.forEach((log) => {
      console.log(`[${log.timestamp || log.created_at}] [${log.level || 'info'}] ${log.event_message || log.message}`);
    });
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

fetchLogs();
