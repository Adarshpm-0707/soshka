import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  // Search all tables and views with 'log' or 'function' in their name
  const { rows } = await client.query(`
    SELECT table_schema, table_name, table_type
    FROM information_schema.tables
    WHERE table_name ILIKE '%log%' OR table_name ILIKE '%function%' OR table_schema ILIKE '%log%' OR table_schema ILIKE '%function%'
    ORDER BY table_schema, table_name
  `);

  console.log('\n📋 Matching logging/function tables and views:');
  rows.forEach(r => console.log(`  - [${r.table_schema}] ${r.table_name} (${r.table_type})`));

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
