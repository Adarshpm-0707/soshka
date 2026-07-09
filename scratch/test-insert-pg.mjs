import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('CONNECTED TO DATABASE. TESTING PG INSERT OF NULLS...');

  try {
    const res = await client.query(`
      INSERT INTO public.store_reviews (name, location, rating, comment, image_url, platform)
      VALUES (NULL, 'Test Location PG', 4, NULL, NULL, 'other')
      RETURNING *;
    `);
    console.log('✅ INSERT SUCCEEDED:', res.rows[0]);

    // Clean up
    await client.query(`DELETE FROM public.store_reviews WHERE id = $1`, [res.rows[0].id]);
    console.log('🗑️ CLEANUP SUCCEEDED');
  } catch (err) {
    console.error('❌ PG INSERT FAILED:', err.message);
  }

  await client.end();
}

main().catch(err => {
  console.error('Execution failed:', err.message);
  process.exit(1);
});
