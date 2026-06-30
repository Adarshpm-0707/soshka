import pg from 'pg';
const { Client } = pg;

const regions = [
  { name: 'Singapore (ap-southeast-1)', host: 'aws-0-ap-southeast-1.pooler.supabase.com' },
  { name: 'Mumbai (ap-south-1)', host: 'aws-0-ap-south-1.pooler.supabase.com' },
  { name: 'Tokyo (ap-northeast-1)', host: 'aws-0-ap-northeast-1.pooler.supabase.com' },
  { name: 'Seoul (ap-northeast-2)', host: 'aws-0-ap-northeast-2.pooler.supabase.com' },
  { name: 'Sydney (ap-southeast-2)', host: 'aws-0-ap-southeast-2.pooler.supabase.com' },
  { name: 'Sydney AP (ap-southeast-3)', host: 'aws-0-ap-southeast-3.pooler.supabase.com' },
  { name: 'Ireland (eu-west-1)', host: 'aws-0-eu-west-1.pooler.supabase.com' },
  { name: 'London (eu-west-2)', host: 'aws-0-eu-west-2.pooler.supabase.com' },
  { name: 'Frankfurt (eu-central-1)', host: 'aws-0-eu-central-1.pooler.supabase.com' },
  { name: 'Paris (eu-west-3)', host: 'aws-0-eu-west-3.pooler.supabase.com' },
  { name: 'Stockholm (eu-north-1)', host: 'aws-0-eu-north-1.pooler.supabase.com' },
  { name: 'North Virginia (us-east-1)', host: 'aws-0-us-east-1.pooler.supabase.com' },
  { name: 'Ohio (us-east-2)', host: 'aws-0-us-east-2.pooler.supabase.com' },
  { name: 'Oregon (us-west-2)', host: 'aws-0-us-west-2.pooler.supabase.com' },
  { name: 'California (us-west-1)', host: 'aws-0-us-west-1.pooler.supabase.com' },
  { name: 'São Paulo (sa-east-1)', host: 'aws-0-sa-east-1.pooler.supabase.com' },
  { name: 'Canada (ca-central-1)', host: 'aws-0-ca-central-1.pooler.supabase.com' }
];

async function main() {
  console.log("Searching all 17 global Supabase regions for project bmbegjxfkpyenndfbcdj...");
  
  for (const region of regions) {
    console.log(`Checking ${region.name}...`);
    const client = new Client({
      host: region.host,
      port: 6543,
      user: 'postgres.bmbegjxfkpyenndfbcdj',
      password: 'Soshka@007@',
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`\n🎉 SUCCESS! Connected to region: ${region.name}`);
      
      // Let's run the DB updates right here since we are connected!
      console.log("Promoting admins and updating RLS policies...");
      
      const emailsToPromote = ['adarshpm0707@gmail.com', 'soshka.in@gmail.com'];
      for (const email of emailsToPromote) {
        const userRes = await client.query("SELECT id, email FROM auth.users WHERE email = $1", [email]);
        if (userRes.rows.length === 0) {
          console.warn(`WARNING: User with email ${email} not found in auth.users. Skipping.`);
          continue;
        }
        const userId = userRes.rows[0].id;
        console.log(`User ${email} found in auth.users with ID: ${userId}`);

        const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [userId]);
        if (profileRes.rows.length === 0) {
          await client.query(
            "INSERT INTO public.profiles (id, name, email, role, is_active) VALUES ($1, $2, $3, $4, $5)",
            [userId, email.split('@')[0], email, 'superadmin', true]
          );
          console.log(`SUCCESS: Created profile row for ${email} with superadmin role!`);
        } else {
          await client.query(
            "UPDATE public.profiles SET role = 'superadmin', is_active = true WHERE id = $1", 
            [userId]
          );
          console.log(`SUCCESS: Promoted existing profile for ${email} to superadmin!`);
        }
      }

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

      console.log("Updating RLS policies for products, categories, and offers...");
      await client.query(`
        -- Products
        DROP POLICY IF EXISTS "Allow admins to insert/update/delete products" ON public.products;
        CREATE POLICY "Allow admins to insert/update/delete products"
            ON public.products FOR ALL
            TO authenticated
            USING (
              (auth.jwt() ->> 'email') IN ('adarshpm0707@gmail.com', 'soshka.in@gmail.com')
              OR (auth.jwt() ->> 'email') LIKE '%admin%'
            )
            WITH CHECK (
              (auth.jwt() ->> 'email') IN ('adarshpm0707@gmail.com', 'soshka.in@gmail.com')
              OR (auth.jwt() ->> 'email') LIKE '%admin%'
            );

        -- Categories
        DROP POLICY IF EXISTS "Allow admins to insert/update/delete categories" ON public.categories;
        CREATE POLICY "Allow admins to insert/update/delete categories"
            ON public.categories FOR ALL
            TO authenticated
            USING (
              (auth.jwt() ->> 'email') IN ('adarshpm0707@gmail.com', 'soshka.in@gmail.com')
              OR (auth.jwt() ->> 'email') LIKE '%admin%'
            )
            WITH CHECK (
              (auth.jwt() ->> 'email') IN ('adarshpm0707@gmail.com', 'soshka.in@gmail.com')
              OR (auth.jwt() ->> 'email') LIKE '%admin%'
            );

        -- Offers
        DROP POLICY IF EXISTS "Allow admins to insert/update/delete offers" ON public.offers;
        CREATE POLICY "Allow admins to insert/update/delete offers"
            ON public.offers FOR ALL
            TO authenticated
            USING (
              (auth.jwt() ->> 'email') IN ('adarshpm0707@gmail.com', 'soshka.in@gmail.com')
              OR (auth.jwt() ->> 'email') LIKE '%admin%'
            )
            WITH CHECK (
              (auth.jwt() ->> 'email') IN ('adarshpm0707@gmail.com', 'soshka.in@gmail.com')
              OR (auth.jwt() ->> 'email') LIKE '%admin%'
            );
      `);
      console.log("🎉 SUCCESS: All database roles and RLS policies updated successfully!");
      await client.end();
      return;
    } catch (err) {
      console.log(`Failed for ${region.name}: ${err.message}`);
    } finally {
      try {
        await client.end();
      } catch (e) {}
    }
  }

  console.log("\n❌ All regions failed. Please double-check your database password or project reference.");
}

main().catch(console.error);
