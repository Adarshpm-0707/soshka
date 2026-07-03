import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to Supabase Database. Adding columns...");

  console.log("Adding specifications column if not exists...");
  await client.query(`
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS specifications text;
  `);

  console.log("Adding shipping_policy column if not exists...");
  await client.query(`
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS shipping_policy text;
  `);

  console.log("SUCCESS: Columns added successfully!");
  await client.end();
}

main().catch(err => {
  console.error("Database migration script failed:", err);
});
