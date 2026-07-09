import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected');

  console.log('\n📋 Profiles:');
  const res = await client.query(`
    SELECT id, email, name, role, is_active FROM public.profiles
  `);
  console.table(res.rows);

  console.log('\n📋 Auth Users:');
  const authRes = await client.query(`
    SELECT id, email, raw_user_meta_data FROM auth.users
  `);
  console.table(authRes.rows.map(r => ({
    id: r.id,
    email: r.email,
    name: r.raw_user_meta_data?.name,
    role: r.raw_user_meta_data?.role
  })));

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
