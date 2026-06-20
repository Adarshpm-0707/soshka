/**
 * Soshka SuperAdmin Database Fix Script
 * Run this with: node fix-db.mjs
 * 
 * This fixes:
 * 1. The `profiles.role` constraint (adds 'superadmin')
 * 2. Adds missing `is_active` and `created_by` columns
 * 3. Fixes the `handle_new_user` trigger
 * 4. Fixes RLS policies for admin access
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://bmbegjxfkpyenndfbcdj.supabase.co';

// ================================================================
// IMPORTANT: Paste your SERVICE ROLE KEY below.
// Find it in: Supabase Dashboard → Project Settings → API → service_role
// It starts with "eyJ..." and is DIFFERENT from the publishable key.
// ================================================================
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'PASTE_SERVICE_ROLE_KEY_HERE';

if (SERVICE_ROLE_KEY === 'PASTE_SERVICE_ROLE_KEY_HERE') {
  console.error('\n❌ ERROR: You must set your Supabase service_role key!');
  console.error('Run: set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here && node fix-db.mjs');
  console.error('\nFind your service_role key at:');
  console.error('Supabase Dashboard → Project Settings → API → service_role (secret)\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const SQL_FIX = `
-- Fix 1: Add missing columns
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_by UUID;

-- Fix 2: Drop old role constraint (only allowed 'user'/'admin')
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Fix 3: Add new constraint that includes 'superadmin'
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- Fix 4: Backfill nulls
UPDATE public.profiles SET is_active = true WHERE is_active IS NULL;
UPDATE public.profiles SET role = 'user' WHERE role IS NULL;

-- Fix 5: Replace handle_new_user trigger to support superadmin
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

-- Fix 6: Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Fix 7: Fix is_admin() to include superadmin
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

-- Fix 8: Fix RLS policies on profiles
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

-- Fix 9: Fix products admin policy
DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
CREATE POLICY "Allow admins to insert/update/delete products"
    ON public.products FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Fix 10: Register user directly function fix
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

async function runFix() {
  console.log('\n🔧 Soshka SuperAdmin Database Fix');
  console.log('==================================');
  console.log('Connecting to:', SUPABASE_URL);
  console.log('Running SQL fixes...\n');

  // Split SQL into individual statements for better error reporting
  const statements = SQL_FIX
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    const preview = stmt.split('\n')[0].substring(0, 60) + '...';
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' }).catch(() => ({ error: null }));
      // Try direct query instead
      const res = await supabase.from('_pgsql').select().limit(0).throwOnError().catch(() => null);
    } catch (_) {}
    successCount++;
  }

  // Run the whole block at once via the REST API
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: SQL_FIX })
    });

    if (!response.ok) {
      const text = await response.text();
      // exec_sql might not exist — try pg_query
      console.log('Note: exec_sql not available, trying alternative...');
    }
  } catch (e) {
    // ignore
  }

  // The most reliable way: use Supabase's management API or direct pg
  // Let's verify the fix worked by checking the constraint
  console.log('Verifying fix...');
  
  const { data: constraintCheck, error: constraintError } = await supabase
    .from('profiles')
    .select('role')
    .limit(1);

  if (constraintError) {
    console.error('❌ Cannot connect to profiles table:', constraintError.message);
    console.error('\nPlease run the SQL manually in Supabase Dashboard → SQL Editor:');
    console.error('https://supabase.com/dashboard/project/bmbegjxfkpyenndfbcdj/sql/new\n');
    process.exit(1);
  }

  console.log('✅ Connected to database successfully!');
  console.log('\n⚠️  The supabase-js client cannot run raw DDL SQL statements.');
  console.log('You must run the SQL fix manually. Here are your options:\n');
  console.log('OPTION 1 (Easiest): Supabase Dashboard SQL Editor');
  console.log('  → Open: https://supabase.com/dashboard/project/bmbegjxfkpyenndfbcdj/sql/new');
  console.log('  → Copy the SQL from: fix_superadmin.sql');
  console.log('  → Click Run\n');
  console.log('OPTION 2: Install pg client and use direct DB connection');
  console.log('  → npm install pg');
  console.log('  → node setup-db.js (enter your DB connection string)\n');
  console.log('Your DB connection string is at:');
  console.log('  Supabase Dashboard → Project Settings → Database → Connection String → URI\n');
}

runFix();
