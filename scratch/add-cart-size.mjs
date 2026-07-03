import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to database.');

  console.log('Adding "size" column to "cart_items" table...');
  await client.query(`
    ALTER TABLE public.cart_items 
    ADD COLUMN IF NOT EXISTS size TEXT DEFAULT '';
  `);

  console.log('Updating unique constraint on "cart_items"...');
  // First, drop the old unique constraint if it exists (usually cart_items_user_id_product_id_key)
  await client.query(`
    ALTER TABLE public.cart_items 
    DROP CONSTRAINT IF EXISTS cart_items_user_id_product_id_key;
  `);

  // Create new unique constraint including size
  await client.query(`
    ALTER TABLE public.cart_items 
    ADD CONSTRAINT cart_items_user_id_product_id_size_key UNIQUE (user_id, product_id, size);
  `);

  console.log('✅ Cart items table successfully updated!');
  await client.end();
}

main().catch(err => {
  console.error('Error executing query:', err.message);
  process.exit(1);
});
