import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  const fn = await client.query(`
    SELECT prosrc
    FROM pg_proc
    WHERE proname = 'handle_new_user'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  `);
  if (fn.rows.length > 0) {
    console.log('\n📜 handle_new_user body:');
    console.log(fn.rows[0].prosrc);
  } else {
    console.log('⚠️ Function not found!');
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
