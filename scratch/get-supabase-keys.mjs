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
    const res = await client.query('SELECT name, decrypted_secret FROM vault.decrypted_secrets');
    console.log('\nDecrypted Secrets in Vault:');
    res.rows.forEach((row) => {
      console.log(`${row.name}: ${row.decrypted_secret}`);
    });
  } catch (err) {
    console.error('Failed to query vault:', err.message);
  } finally {
    await client.end();
  }
}

main();
