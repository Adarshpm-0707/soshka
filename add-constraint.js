import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to database. Setting up foreign key constraint...");

  // Add constraint from public.orders(user_id) to public.profiles(id)
  await client.query(`
    ALTER TABLE public.orders 
    DROP CONSTRAINT IF EXISTS fk_orders_profiles;
    
    ALTER TABLE public.orders 
    ADD CONSTRAINT fk_orders_profiles 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) 
    ON DELETE CASCADE;
  `);

  console.log("SUCCESS: Added fk_orders_profiles constraint! Relational cache is now updated.");
  await client.end();
}

main().catch(console.error);
