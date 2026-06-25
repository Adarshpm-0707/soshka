import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // Add cost column to public.products if it doesn't exist
    console.log('Adding "cost" column to public.products...');
    await client.query(`
      ALTER TABLE public.products 
      ADD COLUMN IF NOT EXISTS cost NUMERIC DEFAULT 0 CHECK (cost >= 0);
    `);
    console.log('✅ Column "cost" added successfully!');

    // Re-verify the schema column details
    const cols = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'cost'
    `);
    console.log('Column definition:', cols.rows[0]);

  } catch (err) {
    console.error('Error modifying products schema:', err);
  } finally {
    await client.end();
  }
}

main();
