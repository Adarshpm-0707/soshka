import pg from 'pg';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim();
    break;
  }
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB. Running migration for guest orders...');
    
    const sql = `
      -- 1. Make user_id nullable in orders table
      ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;

      -- 2. Drop existing policies if present
      DROP POLICY IF EXISTS "Users can insert their own orders" ON orders;
      DROP POLICY IF EXISTS "Users can view own orders or admins can view all" ON orders;
      DROP POLICY IF EXISTS "Anyone can insert guest or own orders" ON orders;
      DROP POLICY IF EXISTS "Anyone can view own order by id" ON orders;

      -- 3. Create updated INSERT policy
      CREATE POLICY "Anyone can insert guest or own orders"
        ON orders
        FOR INSERT
        WITH CHECK (
          auth.uid() = user_id OR user_id IS NULL
        );

      -- 4. Create updated SELECT policy
      CREATE POLICY "Anyone can view own order by id"
        ON orders
        FOR SELECT
        USING (
          user_id IS NULL 
          OR auth.uid() = user_id 
          OR is_admin() 
          OR (auth.role() = 'anon')
        );
    `;

    await client.query(sql);
    console.log('Successfully updated orders table schema and RLS policies for guest orders! 🎉');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
