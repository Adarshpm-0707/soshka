import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  console.log('\n📋 Triggers on auth.users:');
  const triggers = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement, action_timing
    FROM information_schema.triggers
    WHERE event_object_schema = 'auth' AND event_object_table = 'users'
  `);
  console.table(triggers.rows);

  console.log('\n📋 Triggers on public.profiles:');
  const profTriggers = await client.query(`
    SELECT trigger_name, event_manipulation, action_statement, action_timing
    FROM information_schema.triggers
    WHERE event_object_schema = 'public' AND event_object_table = 'profiles'
  `);
  console.table(profTriggers.rows);

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
