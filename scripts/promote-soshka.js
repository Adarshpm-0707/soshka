import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to Supabase Database. Promoting admin accounts...");

  const emailsToPromote = ['adarshpm0707@gmail.com', 'soshka.in@gmail.com'];

  for (const email of emailsToPromote) {
    // 1. Find user in auth.users
    const userRes = await client.query("SELECT id, email FROM auth.users WHERE email = $1", [email]);
    
    if (userRes.rows.length === 0) {
      console.warn(`WARNING: User with email ${email} not found in auth.users. Skipping.`);
      continue;
    }

    const userId = userRes.rows[0].id;
    console.log(`User ${email} found in auth.users with ID: ${userId}`);

    // 2. Check if profile exists in public.profiles
    const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [userId]);

    if (profileRes.rows.length === 0) {
      console.log(`Profile row for ${email} is missing. Creating new profile with superadmin role...`);
      await client.query(
        "INSERT INTO public.profiles (id, name, email, role, is_active) VALUES ($1, $2, $3, $4, $5)",
        [userId, email.split('@')[0], email, 'superadmin', true]
      );
      console.log(`SUCCESS: Created profile row for ${email} with superadmin role!`);
    } else {
      console.log(`Profile row for ${email} exists. Updating role to superadmin...`);
      await client.query(
        "UPDATE public.profiles SET role = 'superadmin', is_active = true WHERE id = $1", 
        [userId]
      );
      console.log(`SUCCESS: Promoted existing profile for ${email} to superadmin!`);
    }
  }

  // 3. Make sure public.is_admin() helper recognizes both hardcoded email checks AND role checks
  console.log("Updating database helper function public.is_admin()...");
  await client.query(`
    CREATE OR REPLACE FUNCTION public.is_admin()
    RETURNS boolean AS $$
    BEGIN
      RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (
            role IN ('admin', 'superadmin') 
            OR email IN ('soshka.in@gmail.com', 'adarshpm0707@gmail.com')
          )
          AND is_active = true
      );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
  console.log("SUCCESS: Helper function public.is_admin() updated!");

  // 4. Add SKU column to products table if not exists
  console.log("Checking and adding SKU column to products table...");
  await client.query(`
    ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
  `);
  console.log("SUCCESS: products table updated with SKU column!");

  await client.end();
}

main().catch(err => {
  console.error("Database promote script failed:", err);
});
