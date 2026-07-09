import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  const res = await client.query(`
    SELECT id, email, encrypted_password FROM auth.users
  `);
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
