import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to database. Setting up products & avatars storage buckets and policies...");

  // 1. Insert buckets
  await client.query(`
    INSERT INTO storage.buckets (id, name, public)
    VALUES 
      ('products', 'products', true),
      ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
  `);
  console.log("Storage buckets 'products' and 'avatars' verified!");

  // 2. Drop existing policies
  await client.query(`
    DROP POLICY IF EXISTS "Allow public select on products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow admin write on products bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public select on avatars bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated insert/update on avatars bucket" ON storage.objects;
  `);
  console.log("Old storage policies dropped!");

  // 3. Create public select policies
  await client.query(`
    CREATE POLICY "Allow public select on products bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'products');

    CREATE POLICY "Allow public select on avatars bucket"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'avatars');
  `);
  console.log("Public select policies created!");

  // 4. Create admin write policy for products bucket
  await client.query(`
    CREATE POLICY "Allow admin write on products bucket"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'products' AND (public.is_admin() OR auth.jwt() ->> 'email' = 'adarshpm0707@gmail.com'))
    WITH CHECK (bucket_id = 'products' AND (public.is_admin() OR auth.jwt() ->> 'email' = 'adarshpm0707@gmail.com'));
  `);
  console.log("Admin write policy for products created!");

  // 5. Create user write policy for avatars bucket
  await client.query(`
    CREATE POLICY "Allow authenticated insert/update on avatars bucket"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'avatars')
    WITH CHECK (bucket_id = 'avatars');
  `);
  console.log("User write policy for avatars created!");

  console.log("SUCCESS: Storage buckets setup is fully complete!");
  await client.end();
}

main().catch((err) => {
  console.error("Error setting up storage:", err);
  process.exit(1);
});
