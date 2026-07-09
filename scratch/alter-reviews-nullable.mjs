import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('CONNECTED TO DATABASE. RUNNING MIGRATION TO MAKE COLUMNS NULLABLE...');

  const query = `
    -- Alter table to drop NOT NULL constraint on name and comment
    ALTER TABLE public.store_reviews ALTER COLUMN name DROP NOT NULL;
    ALTER TABLE public.store_reviews ALTER COLUMN comment DROP NOT NULL;
  `;

  await client.query(query);
  console.log('✅ store_reviews TABLE COLUMNS ALTERED SUCCESSFULLY!');

  // Verify columns
  const checkCols = await client.query(`
    SELECT column_name, is_nullable, data_type
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'store_reviews'
    ORDER BY ordinal_position
  `);
  console.log('\n📋 Current columns status:');
  checkCols.rows.forEach(r => console.log(`  ${r.column_name}: Nullable = ${r.is_nullable} (${r.data_type})`));

  await client.end();
}

main().catch(err => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
