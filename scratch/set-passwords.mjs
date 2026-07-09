import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  console.log('Setting password for soshka.in@gmail.com and adarshpm0707@gmail.com...');
  
  // Use extensions.crypt with gen_salt('bf', 10) to mimic standard Supabase Auth hashing
  const res = await client.query(`
    UPDATE auth.users
    SET encrypted_password = extensions.crypt('Soshka@007', extensions.gen_salt('bf', 10))
    WHERE email IN ('soshka.in@gmail.com', 'adarshpm0707@gmail.com')
    RETURNING id, email, encrypted_password;
  `);

  console.log('Successfully updated users:');
  console.table(res.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
