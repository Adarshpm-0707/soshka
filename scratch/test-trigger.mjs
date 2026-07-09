import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected');

  // Insert a test user into auth.users directly
  const testEmail = 'test_trigger_' + Date.now() + '@soshka.com';
  console.log(`Inserting test user: ${testEmail}`);
  
  const res = await client.query(`
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      $1,
      'fake-hash',
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"name": "Test Trigger User", "role": "admin"}'::jsonb,
      now(),
      now()
    ) RETURNING id, email;
  `, [testEmail]);

  const newUserId = res.rows[0].id;
  console.log(`User created in auth.users with ID: ${newUserId}`);

  // Query profiles table to see if the trigger ran successfully
  console.log('Checking if profile was created...');
  const profRes = await client.query(`
    SELECT * FROM public.profiles WHERE id = $1
  `, [newUserId]);

  if (profRes.rows.length > 0) {
    console.log('🎉 SUCCESS! Trigger created profile automatically:');
    console.table(profRes.rows);
  } else {
    console.log('❌ FAILURE! No profile row created.');
  }

  // Clean up
  await client.query('DELETE FROM auth.users WHERE id = $1', [newUserId]);
  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
