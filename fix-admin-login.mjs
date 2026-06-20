/**
 * Soshka Admin Login Fix Script
 * Fixes: "Database error querying schema" caused by RLS infinite recursion
 * 
 * Root cause: is_admin() queries profiles → profiles RLS calls is_admin() → infinite loop
 * Fix: Use SECURITY DEFINER with a SET search_path so it bypasses RLS safely,
 *      AND use (select auth.uid()) pattern to prevent per-row re-evaluation.
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- ================================================================
-- SOSHKA ADMIN/SUPERADMIN LOGIN FIX
-- Fixes infinite RLS recursion on profiles table
-- ================================================================

-- STEP 1: Ensure columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- STEP 2: Fix role constraint to allow all roles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- STEP 3: Backfill nulls
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- STEP 4: Fix is_admin() to avoid infinite recursion
-- Key: SET search_path='' makes it bypass RLS when querying profiles
-- because SECURITY DEFINER + set search_path runs as definer (postgres role)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role IN ('admin', 'superadmin')
      AND is_active = true
  );
$$;

-- STEP 5: Fix handle_new_user trigger to support roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'user');
  IF v_role NOT IN ('user', 'admin', 'superadmin') THEN
    v_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, name, email, avatar_url, phone, address, role, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    '{}'::jsonb,
    v_role,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    is_active = true,
    updated_at = now();

  RETURN new;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- STEP 6: Drop ALL existing profiles policies to start clean
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- STEP 7: Recreate RLS policies — use (select auth.uid()) to prevent per-row evaluation
-- This is the key fix: subselect evaluates once, not per row, breaking recursion

-- Users see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Admins see ALL profiles — calls is_admin() which now bypasses RLS safely
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Admins update any profile
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert new profiles (when creating admin accounts)
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Trigger function also needs to insert (for signup) — allow anon and service role
-- The trigger runs as SECURITY DEFINER so it bypasses RLS, this is fine.

-- Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- STEP 8: Fix products policy
DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
CREATE POLICY "Allow admins to insert/update/delete products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- STEP 9: Ensure admin_logs table exists and has proper policies
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read logs" ON public.admin_logs;
DROP POLICY IF EXISTS "Admins can insert logs" ON public.admin_logs;

CREATE POLICY "Admins can read logs"
  ON public.admin_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert logs"
  ON public.admin_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- STEP 10: Ensure payment_settings table exists
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  razorpay_key_id text,
  razorpay_key_secret text,
  is_test_mode boolean DEFAULT true,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage payment settings" ON public.payment_settings;
CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- DONE
SELECT 'Fix applied successfully!' AS status;
`;

async function main() {
  console.log('\n🔧 Soshka Admin Login Fix Script');
  console.log('=================================');
  console.log('Connecting to database...\n');

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL database\n');

    console.log('Applying SQL fixes...\n');
    const result = await client.query(SQL);
    
    // Get the last result (SELECT status)
    const lastResult = Array.isArray(result) ? result[result.length - 1] : result;
    if (lastResult?.rows?.[0]?.status) {
      console.log('✅', lastResult.rows[0].status);
    }

    // Verify fix
    console.log('\n📋 Verifying current user profiles...\n');
    const check = await client.query(`
      SELECT 
        u.email,
        p.name,
        p.role,
        p.is_active,
        u.email_confirmed_at IS NOT NULL as email_confirmed
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY u.created_at DESC
    `);

    if (check.rows.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.log('Users in database:');
      for (const row of check.rows) {
        const roleDisplay = row.role || 'NO PROFILE';
        const status = row.is_active ? '✅ active' : '❌ inactive';
        const confirmed = row.email_confirmed ? '✉️ confirmed' : '⚠️ unconfirmed';
        console.log(`  ${row.email}`);
        console.log(`    Role: ${roleDisplay} | Status: ${status} | Email: ${confirmed}`);
      }
    }

    // Check is_admin function
    console.log('\n🔍 Checking is_admin() function...');
    const fnCheck = await client.query(`
      SELECT proname, prosecdef, proconfig
      FROM pg_proc 
      WHERE proname = 'is_admin' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    if (fnCheck.rows.length > 0) {
      const fn = fnCheck.rows[0];
      console.log(`  ✅ is_admin() exists | SECURITY DEFINER: ${fn.prosecdef} | Config: ${fn.proconfig || 'none'}`);
    }

    console.log('\n✅ All fixes applied! Admin and Super Admin login should now work.\n');
    console.log('Next steps:');
    console.log('  1. Try logging in at /admin/login or /superadmin/login');
    console.log('  2. If no superadmin account exists, go to /superadmin/signup to create one');
    console.log('  3. If a user account exists but has wrong role, run:');
    console.log("     UPDATE public.profiles SET role = 'superadmin' WHERE email = 'your@email.com';\n");

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    if (err.detail) console.error('   Detail:', err.detail);
    if (err.hint) console.error('   Hint:', err.hint);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
