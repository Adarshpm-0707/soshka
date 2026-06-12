/**
 * Supabase Database Table Configuration and Trigger Setup Script
 * Runs all schema updates automatically.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Check and install 'pg' dependency if missing
try {
  execSync('node -e "require.resolve(\'pg\')"', { stdio: 'ignore' });
} catch (e) {
  console.log("Installing Postgres client driver ('pg'). Please wait...");
  try {
    execSync('npm install pg', { stdio: 'inherit' });
    console.log("Postgres client driver successfully installed!\n");
  } catch (err) {
    console.error("Failed to install 'pg' automatically. Please run 'npm install pg' manually.", err);
    process.exit(1);
  }
}

// Dynamically import pg now that it is guaranteed to be installed
const pgModule = await import('pg');
const Client = pgModule.default?.Client || pgModule.Client;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const sqlUpdateContent = `-- 1. ALTER profiles table: add role
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
`;

console.log("=========================================");
console.log("Soshka Supabase Schema Setup Tool");
console.log("=========================================\n");

console.log("To find your database connection string, open your Supabase Dashboard:");
console.log("1. Go to Project Settings -> Database");
console.log("2. Scroll down to Connection String -> URI");
console.log("3. Copy the URI and replace [YOUR-PASSWORD] with your actual database password.\n");

rl.question('Paste your Supabase Database URI (connection string): ', async (connectionString) => {
  if (!connectionString.trim()) {
    console.log("Connection URI cannot be empty.");
    rl.close();
    process.exit(1);
  }

  const client = new Client({
    connectionString: connectionString.trim(),
    ssl: { rejectUnauthorized: false } // Required for Supabase
  });

  try {
    console.log("\nConnecting to Supabase Database...");
    await client.connect();
    console.log("Connected successfully!");

    // Check if profiles table exists
    let profilesExists = false;
    try {
      await client.query("SELECT 1 FROM public.profiles LIMIT 1");
      profilesExists = true;
    } catch (e) {
      profilesExists = false;
    }

    if (!profilesExists) {
      console.log("\nCore database tables are missing. Running base schema.sql first...");
      const baseSqlPath = path.join(process.cwd(), 'schema.sql');
      if (fs.existsSync(baseSqlPath)) {
        const baseSql = fs.readFileSync(baseSqlPath, 'utf8');
        await client.query(baseSql);
        console.log("Core database tables created successfully!");
      } else {
        console.warn("Warning: base schema.sql file not found in current directory.");
      }
    } else {
      console.log("\nExisting database tables found. Skipping base schema creation.");
    }

    console.log("\nRunning admin panel SQL Schema modifications & triggers...");
    await client.query(sqlUpdateContent);
    console.log("\nSuccess! Tables created, columns added, and triggers configured successfully.");
    console.log("Admins registered via /admin/signup will now automatically get role='admin' in profiles.");
  } catch (err) {
    console.error("\nDatabase Setup Error:", err.message);
  } finally {
    await client.end();
    rl.close();
  }
});
