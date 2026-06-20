import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  
  try {
    await client.query("BEGIN;");
    await client.query("SET ROLE authenticated;");
    await client.query("SELECT set_config('request.jwt.claim.sub', '5e441fc7-1e1b-4f01-86f8-b3d8dce8a967', true);");
    
    console.log("Attempting to query admin_logs under RLS...");
    const res = await client.query("SELECT * FROM public.admin_logs LIMIT 5;");
    console.log("Query success! Rows count:", res.rows.length);
    console.log("Rows:", res.rows);
    
    await client.query("ROLLBACK;");
  } catch (err) {
    console.error("Simulation error querying admin_logs:");
    console.error(err);
    await client.query("ROLLBACK;");
  } finally {
    await client.end();
  }
}

main().catch(console.error);
