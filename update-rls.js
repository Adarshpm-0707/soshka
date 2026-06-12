import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to database. Adjusting RLS policies for Admin view access...");

  // 1. Update profiles select policy
  await client.query(`
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can view own profile or admins can view all" ON public.profiles;
    
    CREATE POLICY "Users can view own profile or admins can view all" 
    ON public.profiles FOR SELECT 
    TO authenticated
    USING (auth.uid() = id OR public.is_admin());
  `);
  console.log("Profiles RLS policy updated!");

  // 2. Update orders select policy & add update policy
  await client.query(`
    DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
    DROP POLICY IF EXISTS "Users can view own orders or admins can view all" ON public.orders;
    DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
    
    CREATE POLICY "Users can view own orders or admins can view all" 
    ON public.orders FOR SELECT 
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin());
    
    CREATE POLICY "Admins can update orders" 
    ON public.orders FOR UPDATE 
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
  `);
  console.log("Orders RLS policies updated!");

  console.log("SUCCESS: Database RLS policies updated! Admin dashboard has now full access to all tables.");
  await client.end();
}

main().catch(console.error);
