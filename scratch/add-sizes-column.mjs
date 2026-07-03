import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to database.');

  console.log('Adding "sizes" column to "products" table...');
  await client.query(`
    ALTER TABLE public.products 
    ADD COLUMN IF NOT EXISTS sizes text[] DEFAULT '{}'::text[];
  `);
  console.log('✅ "sizes" column successfully added!');

  await client.end();
}

main().catch(err => {
  console.error('Error executing query:', err.message);
  process.exit(1);
});
