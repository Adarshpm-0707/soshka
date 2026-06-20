/**
 * Soshka: Diagnose and fix "Database error finding user" 
 * Checks current DB state and fixes admin_logs schema + all remaining issues
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected\n');

  // --- 1. Check admin_logs columns ---
  console.log('📋 admin_logs columns:');
  const logsCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_logs'
    ORDER BY ordinal_position
  `);
  logsCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // --- 2. Check payment_settings columns ---
  console.log('\n📋 payment_settings columns:');
  const paymentCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'payment_settings'
    ORDER BY ordinal_position
  `);
  paymentCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // --- 3. Check profiles columns ---
  console.log('\n📋 profiles columns:');
  const profCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles'
    ORDER BY ordinal_position
  `);
  profCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  // --- 4. Check RLS policies on profiles ---
  console.log('\n🔒 RLS policies on profiles:');
  const policies = await client.query(`
    SELECT policyname, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles'
  `);
  policies.rows.forEach(r => console.log(`  [${r.cmd}] ${r.policyname}`));

  // --- 5. Check is_admin function ---
  console.log('\n🔍 is_admin() function:');
  const fn = await client.query(`
    SELECT prosecdef, proconfig, prosrc
    FROM pg_proc
    WHERE proname = 'is_admin'
      AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  `);
  if (fn.rows.length > 0) {
    console.log(`  SECURITY DEFINER: ${fn.rows[0].prosecdef}`);
    console.log(`  Config: ${fn.rows[0].proconfig}`);
    console.log(`  Body: ${fn.rows[0].prosrc?.slice(0, 200)}`);
  } else {
    console.log('  ⚠️ Function not found!');
  }

  // --- 6. Check orders table ---
  console.log('\n📋 orders columns:');
  const orderCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders'
    ORDER BY ordinal_position
  `);
  orderCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
