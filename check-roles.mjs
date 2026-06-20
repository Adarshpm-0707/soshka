import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();

const res = await client.query(`
  SELECT u.email, p.role, p.is_active, p.name, u.email_confirmed_at IS NOT NULL as confirmed
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  ORDER BY u.created_at DESC
`);

console.log('\nUsers and their roles:');
for (const r of res.rows) {
  console.log(`  ${r.email} | role: ${r.role || 'NO_PROFILE'} | active: ${r.is_active} | confirmed: ${r.confirmed}`);
}

await client.end();
