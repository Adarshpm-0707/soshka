/**
 * Soshka SuperAdmin Database Fix — Direct PostgreSQL Script
 * 
 * Usage:
 *   node apply-fix.mjs "postgresql://postgres:[PASSWORD]@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres"
 *
 * Get your connection string from:
 *   Supabase Dashboard → Project Settings → Database → Connection String → URI
 *   Replace [YOUR-PASSWORD] with your actual database password.
 */

import pg from 'pg';
const { Client } = pg;

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('\n❌ Missing connection string!');
  console.error('\nUsage:');
  console.error('  node apply-fix.mjs "postgresql://postgres:[PASSWORD]@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres"');
  console.error('\nGet your connection string from:');
  console.error('  Supabase Dashboard → Project Settings → Database → Connection String → URI\n');
  process.exit(1);
}

const SQL_FIX = `
-- ============================================================
-- SOSHKA SUPERADMIN DATABASE FIX
-- ============================================================

-- Step 1: Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID;

-- Step 2: Fix role CHECK constraint to include 'superadmin'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- Step 3: Backfill nulls
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Step 4: Fix handle_new_user trigger to support superadmin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
    is_active = true;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 6: Fix is_admin() to include superadmin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Fix RLS policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT TO authenticated
    USING ((select auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

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

-- Step 8: Fix products admin policy
DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
CREATE POLICY "Allow admins to insert/update/delete products"
    ON public.products FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Step 9: Register user directly function fix
DROP FUNCTION IF EXISTS public.register_user_directly(text, text, text, text);
DROP FUNCTION IF EXISTS public.register_user_directly(text, text, text, text, text);

CREATE OR REPLACE FUNCTION public.register_user_directly(
  p_email TEXT,
  p_password TEXT,
  p_name TEXT,
  p_role TEXT DEFAULT 'user',
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_user_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = LOWER(p_email)
  ) INTO v_user_exists;

  IF v_user_exists THEN
    RETURN jsonb_build_object('success', false, 'message', 'User with this email already exists.');
  END IF;

  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    LOWER(p_email),
    extensions.crypt(p_password, extensions.gen_salt('bf', 10)),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('name', p_name, 'role', p_role, 'phone', COALESCE(p_phone, '')),
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id INTO v_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'User registered successfully.'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`;

async function main() {
  console.log('\n🔧 Soshka SuperAdmin Database Fix');
  console.log('===================================');
  
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('Running SQL fixes...');
    await client.query(SQL_FIX);
    
    console.log('✅ All fixes applied successfully!\n');
    console.log('You can now:');
    console.log('  1. Go to /superadmin/signup to create a superadmin account');
    console.log('  2. Log in at /superadmin/login');
    console.log('');
  } catch (err) {
    console.error('\n❌ Error applying fix:', err.message);
    console.error('\nIf you see a password error, make sure to replace [YOUR-PASSWORD] in the connection string.');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
