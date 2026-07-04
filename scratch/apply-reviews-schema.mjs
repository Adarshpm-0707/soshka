import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('CONNECTED TO DATABASE. RUNNING MIGRATION...');

  const query = `
    CREATE TABLE IF NOT EXISTS public.store_reviews (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        name text NOT NULL,
        location text,
        rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
        comment text NOT NULL,
        image_url text,
        platform text DEFAULT 'other',
        created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
    );

    -- Enable RLS
    ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

    -- Select policy: Allow anyone to view store reviews
    DROP POLICY IF EXISTS "Allow public read access to store reviews" ON public.store_reviews;
    CREATE POLICY "Allow public read access to store reviews"
        ON public.store_reviews FOR SELECT
        USING (true);

    -- Admin policy: Allow admins to insert/update/delete store reviews
    DROP POLICY IF EXISTS "Allow admins to insert/update/delete store reviews" ON public.store_reviews;
    CREATE POLICY "Allow admins to insert/update/delete store reviews"
        ON public.store_reviews FOR ALL
        TO authenticated
        USING (public.is_admin())
        WITH CHECK (public.is_admin());
  `;

  await client.query(query);
  console.log('✅ store_reviews TABLE AND RLS POLICIES CREATED SUCCESSFULLY!');

  // Verify columns
  const checkCols = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'store_reviews'
    ORDER BY ordinal_position
  `);
  console.log('\n📋 columns created:');
  checkCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));

  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
