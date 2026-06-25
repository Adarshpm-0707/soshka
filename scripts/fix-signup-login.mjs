/**
 * Soshka: Fix Signup → Immediate Login Flow
 * ==========================================
 * Problem: After signup, Supabase requires email confirmation,
 *          which blocks admin/superadmin from logging in immediately.
 *
 * This script:
 *   1. Auto-confirms ALL existing unconfirmed auth users
 *   2. Ensures every auth.users row has a matching profiles row with correct role
 *   3. Verifies the full state
 *
 * To permanently skip email confirmation for NEW signups:
 *   → Go to Supabase Dashboard > Auth > Settings > "Confirm email" → DISABLE it
 *   OR this script will patch existing users right now.
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('\n🔧 Soshka — Fix Signup → Login Flow');
  console.log('=====================================');
  console.log('Connecting to database...\n');

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL\n');

    // ── STEP 1: Show current users ─────────────────────────────────────────
    console.log('📋 Current users in auth.users:\n');
    const users = await client.query(`
      SELECT
        u.id,
        u.email,
        u.email_confirmed_at,
        u.raw_user_meta_data->>'role' AS meta_role,
        u.raw_user_meta_data->>'name' AS meta_name,
        p.role AS profile_role,
        p.is_active,
        p.name AS profile_name
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY u.created_at DESC;
    `);

    if (users.rows.length === 0) {
      console.log('  (no users found)\n');
    } else {
      for (const u of users.rows) {
        const confirmed = u.email_confirmed_at ? '✅ confirmed' : '⚠️  NOT CONFIRMED';
        const profileRole = u.profile_role || '❌ NO PROFILE';
        console.log(`  📧 ${u.email}`);
        console.log(`     Email: ${confirmed}`);
        console.log(`     Meta role: ${u.meta_role || 'user'} | Profile role: ${profileRole}`);
        console.log(`     Active: ${u.is_active ?? 'N/A'} | Name: ${u.profile_name || u.meta_name || '—'}\n`);
      }
    }

    // ── STEP 2: Auto-confirm ALL unconfirmed users ─────────────────────────
    console.log('🔓 Auto-confirming all unconfirmed email addresses...');
    const confirmed = await client.query(`
      UPDATE auth.users
      SET
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        confirmation_token = '',
        confirmation_sent_at = NULL
      WHERE email_confirmed_at IS NULL
      RETURNING id, email;
    `);

    if (confirmed.rows.length === 0) {
      console.log('   ✅ All users already confirmed.\n');
    } else {
      console.log(`   ✅ Confirmed ${confirmed.rows.length} user(s):`);
      for (const r of confirmed.rows) {
        console.log(`      • ${r.email}`);
      }
      console.log();
    }

    // ── STEP 3: Ensure profiles exist for ALL auth users ──────────────────
    console.log('👤 Ensuring profiles exist for all auth users...');
    const profilesFixed = await client.query(`
      INSERT INTO public.profiles (id, name, email, role, is_active, updated_at)
      SELECT
        u.id,
        COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
        u.email,
        CASE
          WHEN u.raw_user_meta_data->>'role' IN ('admin', 'superadmin', 'user')
          THEN u.raw_user_meta_data->>'role'
          ELSE 'user'
        END,
        true,
        now()
      FROM auth.users u
      WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id)
      RETURNING id, email, role;
    `);

    if (profilesFixed.rows.length === 0) {
      console.log('   ✅ All profiles already exist.\n');
    } else {
      console.log(`   ✅ Created ${profilesFixed.rows.length} missing profile(s):`);
      for (const r of profilesFixed.rows) {
        console.log(`      • ${r.email}  [${r.role}]`);
      }
      console.log();
    }

    // ── STEP 4: Sync profile roles from user metadata ─────────────────────
    console.log('🔄 Syncing profile roles from user metadata...');
    const synced = await client.query(`
      UPDATE public.profiles p
      SET
        role = CASE
          WHEN u.raw_user_meta_data->>'role' IN ('admin', 'superadmin', 'user')
          THEN u.raw_user_meta_data->>'role'
          ELSE p.role
        END,
        is_active = COALESCE(p.is_active, true),
        updated_at = now()
      FROM auth.users u
      WHERE p.id = u.id
        AND u.raw_user_meta_data->>'role' IN ('admin', 'superadmin')
        AND p.role != u.raw_user_meta_data->>'role'
      RETURNING p.email, p.role;
    `);

    if (synced.rows.length === 0) {
      console.log('   ✅ All profile roles already in sync.\n');
    } else {
      console.log(`   ✅ Synced ${synced.rows.length} profile role(s):`);
      for (const r of synced.rows) {
        console.log(`      • ${r.email}  → ${r.role}`);
      }
      console.log();
    }

    // ── STEP 5: Final verification ────────────────────────────────────────
    console.log('📊 Final state — all users:\n');
    const final = await client.query(`
      SELECT
        u.email,
        p.name,
        p.role,
        p.is_active,
        u.email_confirmed_at IS NOT NULL AS can_login
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY p.role, u.created_at DESC;
    `);

    if (final.rows.length === 0) {
      console.log('  (no users)\n');
    } else {
      for (const r of final.rows) {
        const loginStatus = r.can_login ? '✅ can login' : '❌ email unconfirmed';
        const active = r.is_active ? 'active' : 'inactive';
        console.log(`  [${(r.role || 'NO PROFILE').toUpperCase()}] ${r.email}`);
        console.log(`     Name: ${r.name || '—'} | Status: ${active} | Login: ${loginStatus}\n`);
      }
    }

    console.log('✅ Done! All users can now log in immediately after signup.');
    console.log('\n⚡ IMPORTANT: To prevent this issue for new signups:');
    console.log('   Go to → Supabase Dashboard > Authentication > Settings');
    console.log('   Under "Email Auth" → turn OFF "Confirm email"\n');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
