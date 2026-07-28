import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected');

  // Check RLS status of store_reviews table
  try {
    const res = await client.query(`
      SELECT relname, relrowsecurity 
      FROM pg_class 
      WHERE relname = 'store_reviews'
    `);
    console.log('store_reviews RLS status:', res.rows);
  } catch (err) {
    console.error('Error checking RLS status:', err.message);
  }

  // Check policies on store_reviews table
  try {
    const res = await client.query(`
      SELECT policyname, cmd, roles, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'store_reviews'
    `);
    console.log('store_reviews policies:', res.rows);
  } catch (err) {
    console.error('Error checking policies:', err.message);
  }

  await client.end();
}

main();
