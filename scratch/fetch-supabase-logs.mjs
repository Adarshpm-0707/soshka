const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function fetchLogs() {
  console.log(`Fetching Deno function logs for project ${PROJECT_REF}...`);
  
  // Try calling the standard logs endpoint
  // query: type=fn (for edge functions)
  const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/logs?type=fn&limit=30`, {
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
