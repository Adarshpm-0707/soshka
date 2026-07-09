import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  console.log('Inserting missing profiles...');
  const res = await client.query(`
    INSERT INTO public.profiles (id, name, email, role, is_active, updated_at)
    SELECT 
      id, 
      COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)), 
      email, 
      COALESCE(raw_user_meta_data->>'role', 'user'),
      true,
      NOW()
    FROM auth.users
    ON CONFLICT (id) DO UPDATE SET
      role = EXCLUDED.role,
      name = EXCLUDED.name,
      email = EXCLUDED.email
    RETURNING id, email, name, role;
  `);

  console.log(`Successfully processed ${res.rowCount} profiles:`);
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
