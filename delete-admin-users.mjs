/**
 * Soshka: Delete All Admin & SuperAdmin Users
 * -------------------------------------------
 * This script:
 *   1. Lists all admin/superadmin users (so you can confirm)
 *   2. Deletes them from auth.users (profiles cascade-deleted automatically)
 *   3. Verifies the database is fully cleared of those roles
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('\n🗑️  Soshka — Delete All Admin & SuperAdmin Users');
  console.log('=================================================');
  console.log('Connecting to database...\n');

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    // ── STEP 1: List who will be deleted ──────────────────────────────────
    const preview = await client.query(`
      SELECT
        u.id,
        u.email,
        p.name,
        p.role,
        p.is_active,
        u.created_at
      FROM auth.users u
      JOIN public.profiles p ON u.id = p.id
      WHERE p.role IN ('admin', 'superadmin')
      ORDER BY p.role, u.created_at;
    `);

    if (preview.rows.length === 0) {
      console.log('ℹ️  No admin or superadmin accounts found in the database.');
      console.log('   Nothing to delete. Exiting.\n');
      return;
    }

    console.log(`Found ${preview.rows.length} admin/superadmin account(s) to delete:\n`);
    for (const row of preview.rows) {
      console.log(`  [${row.role.toUpperCase()}] ${row.email}`);
      console.log(`    Name: ${row.name || '(none)'}  |  Active: ${row.is_active}  |  ID: ${row.id}`);
    }

    // ── STEP 2: Delete from auth.users ────────────────────────────────────
    //   Profiles are CASCADE deleted because:
    //     public.profiles.id REFERENCES auth.users ON DELETE CASCADE
    console.log('\n🔥 Deleting admin/superadmin users from auth.users ...');

    const deleted = await client.query(`
      DELETE FROM auth.users
      WHERE id IN (
        SELECT id FROM public.profiles WHERE role IN ('admin', 'superadmin')
      )
      RETURNING id, email;
    `);

    console.log(`\n✅ Deleted ${deleted.rows.length} user(s) from auth.users:`);
    for (const row of deleted.rows) {
      console.log(`   • ${row.email}  (${row.id})`);
    }

    // ── STEP 3: Verify the profiles table is clean ────────────────────────
    console.log('\n🔍 Verifying — checking remaining admin/superadmin profiles ...');
    const remaining = await client.query(`
      SELECT email, role FROM public.profiles
      WHERE role IN ('admin', 'superadmin');
    `);

    if (remaining.rows.length === 0) {
      console.log('✅ All admin/superadmin data fully cleared from the database!\n');
    } else {
      console.log(`⚠️  ${remaining.rows.length} profile(s) with admin/superadmin role still remain:`);
      for (const r of remaining.rows) {
        console.log(`   • ${r.email}  (${r.role})`);
      }
    }

    // ── STEP 4: Show remaining users summary ──────────────────────────────
    console.log('📋 Remaining users in database:');
    const allUsers = await client.query(`
      SELECT u.email, COALESCE(p.role, 'NO PROFILE') as role
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY u.created_at DESC;
    `);

    if (allUsers.rows.length === 0) {
      console.log('   (no users remaining)\n');
    } else {
      for (const row of allUsers.rows) {
        console.log(`   • ${row.email}  [${row.role}]`);
      }
      console.log();
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    if (err.hint)   console.error('   Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
