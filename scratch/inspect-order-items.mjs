import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to database');

  try {
    const res = await client.query('SELECT id, items FROM public.orders ORDER BY created_at DESC LIMIT 1');
    if (res.rows.length > 0) {
      console.log('Order ID:', res.rows[0].id);
      console.log('Items column content type:', typeof res.rows[0].items);
      console.log('Items value:', JSON.stringify(res.rows[0].items, null, 2));
    } else {
      console.log('No orders found');
    }
  } catch (err) {
    console.error('Failed to query:', err.message);
  } finally {
    await client.end();
  }
}

main();
