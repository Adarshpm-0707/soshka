const PROJECT_REF = 'bmbegjxfkpyenndfbcdj';
const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function fetchTables() {
  console.log(`Fetching ClickHouse log tables...`);
  
  const sql = "SHOW TABLES";
  const url = `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all?sql=${encodeURIComponent(sql)}`;
  
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('Failed:', res.status, await res.text());
    return;
  }

  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

fetchTables();
