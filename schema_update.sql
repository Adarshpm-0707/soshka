-- ========================================================
-- SCHEMA UPDATE & ADMINISTRATIVE SETUP
-- ========================================================

-- 1. ALTER profiles table: add role
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Update the handle_new_user function to respect metadata role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, avatar_url, phone, address, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    '{}'::jsonb,
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. New table: categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 3. New table: offers
CREATE TABLE IF NOT EXISTS public.offers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    message text,
    discount_percent integer NOT NULL CHECK (discount_percent >= 0 AND discount_percent <= 100),
    is_active boolean DEFAULT false,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. ALTER products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS original_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_price numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL;

-- Enable RLS on new tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Helper admin function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing admin products policy if exists, and create new one
DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
CREATE POLICY "Allow admins to insert/update/delete products"
    ON public.products FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policies for categories
CREATE POLICY "Allow public read access to categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Allow admins to insert/update/delete categories"
    ON public.categories FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Policies for offers
CREATE POLICY "Allow public read access to offers"
    ON public.offers FOR SELECT
    USING (true);

CREATE POLICY "Allow admins to insert/update/delete offers"
    ON public.offers FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Create products storage bucket and policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('products', 'products', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public select on products bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'products');

CREATE POLICY "Allow admin write on products bucket"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'products' AND public.is_admin())
    WITH CHECK (bucket_id = 'products' AND public.is_admin());
