const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function fetchLogs() {
  console.log(`Fetching Deno function logs for project ${PROJECT_REF} via logs.all and ClickHouse SQL...`);
  
  // clickhouse sql query to get function logs
  const sql = "SELECT timestamp, event_message FROM function_logs WHERE timestamp >= subtractHours(now(), 1) ORDER BY timestamp DESC LIMIT 50";
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`;
  
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
      console.log(`[${log.timestamp}] ${log.event_message}`);
    });
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

fetchLogs();
