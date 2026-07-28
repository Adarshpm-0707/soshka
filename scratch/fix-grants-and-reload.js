import pg from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim();
    break;
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database successfully.');

    const sql = `
      -- Explicitly grant permissions to public schema tables for anon and authenticated roles
      GRANT ALL ON TABLE public.coupons TO anon, authenticated, service_role;
      GRANT ALL ON TABLE public.coupon_usage TO anon, authenticated, service_role;

      -- Grant usage on sequences if any
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

      -- Reload PostgREST schema cache
      NOTIFY pgrst, 'reload schema';
    `;

    console.log('Granting permissions and reloading PostgREST schema cache...');
    await client.query(sql);
    console.log('SUCCESS: Table permissions granted and PostgREST schema reloaded!');

    // Let's also verify tables exist in public schema
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('coupons', 'coupon_usage');
    `);
    console.log('Existing tables in public schema:', res.rows.map(r => r.table_name));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
