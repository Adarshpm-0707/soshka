import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database\n');

  console.log('📋 Fetching store_reviews:');
  const res = await client.query('SELECT id, name, image_url, platform FROM public.store_reviews');
  console.log(`Found ${res.rows.length} reviews.`);

  for (const row of res.rows) {
    console.log(`Review ${row.id}: name=${row.name}, image_url=${row.image_url}, platform=${row.platform}`);
    if (row.image_url && (row.image_url.endsWith('.png') || row.image_url.endsWith('.PNG'))) {
      const newUrl = row.image_url.replace(/\.png$/i, '.webp');
      console.log(`  Updating to: ${newUrl}`);
      await client.query('UPDATE public.store_reviews SET image_url = $1 WHERE id = $2', [newUrl, row.id]);
      console.log('  Updated successfully!');
    }
  }

  await client.end();
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
