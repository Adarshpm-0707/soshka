import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected');

  // Call the function directly in SQL to mimic the RPC call
  const testEmail = 'test_rpc_' + Date.now() + '@soshka.com';
  console.log(`Calling register_user_directly for: ${testEmail}`);
  
  const res = await client.query(`
    SELECT public.register_user_directly(
      $1,
      'password123',
      'Test RPC User',
      'admin',
      '1234567890'
    ) as result;
  `, [testEmail]);

  const result = res.rows[0].result;
  console.log('RPC result:', result);

  if (result.success) {
    const newUserId = result.user_id;
    // Check if profile was created
    const profRes = await client.query(`
      SELECT * FROM public.profiles WHERE id = $1
    `, [newUserId]);

    if (profRes.rows.length > 0) {
      console.log('🎉 SUCCESS! Profile created via RPC trigger:');
      console.table(profRes.rows);
    } else {
      console.log('❌ FAILURE! Profile not created via RPC trigger.');
    }

    // Clean up
    await client.query('DELETE FROM auth.users WHERE id = $1', [newUserId]);
  } else {
    console.log('❌ RPC call failed:', result.message);
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
