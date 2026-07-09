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
    const res = await client.query('SELECT id, status, payment_method, shipping_address, created_at FROM public.orders ORDER BY created_at DESC LIMIT 3');
    console.log('\nLast 3 orders in DB:');
    res.rows.forEach((row) => {
      console.log('---');
      console.log('ID:', row.id);
      console.log('Status:', row.status);
      console.log('Payment Method:', row.payment_method);
      console.log('Created At:', row.created_at);
      console.log('Shipping Address Type:', typeof row.shipping_address);
      console.log('Shipping Address Value:', JSON.stringify(row.shipping_address, null, 2));
    });
  } catch (err) {
    console.error('Failed to query orders:', err.message);
  } finally {
    await client.end();
  }
}

main();
