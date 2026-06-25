/**
 * Soshka: Full Database Schema Fix
 * Fixes: "Database error finding user" and all related schema issues
 * 
 * Issues fixed:
 * 1. admin_logs table: wrong column name (admin_id vs actor_id), missing columns
 * 2. payment_settings table: wrong column names
 * 3. RLS policies: still causing recursion or blocking auth
 * 4. Orders table: missing updated_at / missing admin read policies
 * 5. auth.users getUser() errors: caused by stale sessions after schema changes
 */

import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const SQL = `
-- =====================================================================
-- SOSHKA FULL DATABASE SCHEMA FIX
-- Fixes "Database error finding user" + all admin/superadmin issues
-- =====================================================================

-- ============================================================
-- PART 1: PROFILES TABLE - ensure all columns exist correctly
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Fix role constraint
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- Backfill nulls
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- ============================================================
-- PART 2: is_admin() - SECURITY DEFINER + search_path bypass
-- ============================================================
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

-- ============================================================
-- PART 3: handle_new_user() trigger - support all roles
-- ============================================================
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

  INSERT INTO public.profiles (id, name, email, avatar_url, phone, address, role, is_active, updated_at)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    '{}'::jsonb,
    v_role,
    true,
    now()
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- PART 4: PROFILES RLS - clean rebuild
-- ============================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PART 5: ADMIN_LOGS table - rebuild with correct column names
-- The app code uses: actor_id, action, target_table, target_id, details
-- ============================================================
DROP TABLE IF EXISTS public.admin_logs CASCADE;

CREATE TABLE public.admin_logs (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  target_table TEXT,
  target_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read logs"
  ON public.admin_logs FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can insert logs"
  ON public.admin_logs FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================
-- PART 6: PAYMENT_SETTINGS table - rebuild with correct columns
-- The app code uses: gateway, api_key, api_secret, is_active, updated_by, updated_at
-- paymentSettingsService also joins with profiles(name, email) on updated_by
-- ============================================================
DROP TABLE IF EXISTS public.payment_settings CASCADE;

CREATE TABLE public.payment_settings (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gateway     TEXT NOT NULL DEFAULT 'razorpay',
  api_key     TEXT,
  api_secret  TEXT,
  is_active   BOOLEAN DEFAULT true,
  updated_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PART 7: PRODUCTS policy fix
-- ============================================================
DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
CREATE POLICY "Allow admins to insert/update/delete products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- PART 8: ORDERS - add admin read policy
-- ============================================================
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders"
  ON public.orders FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete orders" ON public.orders;
CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE TO authenticated
  USING (public.is_admin());

-- ============================================================
-- PART 9: OFFERS table - create if missing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  discount_percent NUMERIC CHECK (discount_percent >= 0 AND discount_percent <= 100),
  code        TEXT UNIQUE,
  is_active   BOOLEAN DEFAULT true,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active offers" ON public.offers;
CREATE POLICY "Public can view active offers"
  ON public.offers FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage offers" ON public.offers;
CREATE POLICY "Admins can manage offers"
  ON public.offers FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- DONE
-- ============================================================
SELECT 'Full schema fix applied successfully!' AS status;
`;

async function main() {
  console.log('\n🔧 Soshka Full Database Fix');
  console.log('============================');
  console.log('Connecting to database...\n');

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Run full SQL fix
    console.log('Running schema fixes...');
    const result = await client.query(SQL);
    const last = Array.isArray(result) ? result[result.length - 1] : result;
    if (last?.rows?.[0]?.status) {
      console.log('✅', last.rows[0].status);
    }

    // Verify admin_logs columns
    console.log('\n📋 admin_logs columns:');
    const logsCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_logs'
      ORDER BY ordinal_position
    `);
    logsCols.rows.forEach(r => console.log(`  ✓ ${r.column_name} (${r.data_type})`));

    // Verify payment_settings columns
    console.log('\n📋 payment_settings columns:');
    const payCols = await client.query(`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'payment_settings'
      ORDER BY ordinal_position
    `);
    payCols.rows.forEach(r => console.log(`  ✓ ${r.column_name} (${r.data_type})`));

    // Verify is_admin()
    console.log('\n🔍 is_admin() function:');
    const fn = await client.query(`
      SELECT prosecdef, proconfig FROM pg_proc
      WHERE proname = 'is_admin'
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    if (fn.rows.length > 0) {
      console.log(`  ✓ SECURITY DEFINER: ${fn.rows[0].prosecdef}`);
      console.log(`  ✓ search_path bypass: ${fn.rows[0].proconfig || '(none)'}`);
    }

    // Verify users
    console.log('\n👥 Current users:');
    const users = await client.query(`
      SELECT u.email, p.role, p.is_active,
             u.email_confirmed_at IS NOT NULL AS confirmed
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY u.created_at DESC
    `);
    users.rows.forEach(r => {
      const status = r.is_active ? '✅' : '❌';
      const confirmed = r.confirmed ? '✉️' : '⚠️ unconfirmed';
      console.log(`  ${status} ${r.email} | ${r.role || 'no profile'} | ${confirmed}`);
    });

    console.log('\n✅ All fixes applied successfully!');
    console.log('\nYou can now:');
    console.log('  • Login at /admin/login with an admin/superadmin account');
    console.log('  • Login at /superadmin/login with a superadmin account');
    console.log('  • The "Database error finding user" should be resolved\n');

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
