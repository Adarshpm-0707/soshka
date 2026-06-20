-- ============================================================
-- SOSHKA SUPERADMIN FIX SCRIPT
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- STEP 1: Fix the `role` CHECK constraint to allow 'superadmin'
-- ============================================================

-- Drop the old constraint that only allows 'user' and 'admin'
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add updated constraint that also allows 'superadmin'
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'superadmin'));

-- ============================================================
-- STEP 2: Add missing columns to profiles table
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- ============================================================
-- STEP 3: Fix the handle_new_user trigger function
-- Allows 'superadmin' from metadata AND defaults unknown values to 'user'
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Extract role from metadata, default to 'user'
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'user');

  -- Safety: only allow known roles from metadata
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

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================
-- STEP 4: Fix the is_admin() helper function to include superadmin
-- ============================================================
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

-- ============================================================
-- STEP 5: Fix RLS policies on profiles
-- Allow superadmins to read ALL profiles (needed for ManageAdminsPage)
-- ============================================================

-- Drop old restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Users can see their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- Admins and superadmins can see ALL profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Users can update only their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Admins can update any profile (for role management)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admins can insert profiles (for creating new admins)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Admins can delete profiles
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ============================================================
-- STEP 6: Fix products policy (is_admin already fixed above)
-- ============================================================
DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
CREATE POLICY "Allow admins to insert/update/delete products"
  ON public.products FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- STEP 7: Backfill — ensure all existing users have valid data
-- ============================================================
UPDATE public.profiles
  SET is_active = true
  WHERE is_active IS NULL;

UPDATE public.profiles
  SET role = 'user'
  WHERE role IS NULL;

-- ============================================================
-- DONE — schema fixes applied
-- ============================================================
