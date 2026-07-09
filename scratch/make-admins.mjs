import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  console.log('Updating roles in profiles...');
  const res1 = await client.query(`
    UPDATE public.profiles
    SET role = 'superadmin'
    WHERE email = 'adarshpm0707@gmail.com'
    RETURNING id, email, role;
  `);

  const res2 = await client.query(`
    UPDATE public.profiles
    SET role = 'admin'
    WHERE email = 'soshka.in@gmail.com'
    RETURNING id, email, role;
  `);

  console.log('Adarsh PM update:', res1.rows);
  console.log('Soshka update:', res2.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
