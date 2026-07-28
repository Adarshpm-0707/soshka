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
    console.log('Connected to DB.');
    
    // Check orders table RLS policies
    const res = await client.query(`
      SELECT policyname, roles, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'orders';
    `);
    console.log('Orders Table RLS Policies:', res.rows);

    // Check user_id column nullability
    const colRes = await client.query(`
      SELECT column_name, is_nullable, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id';
    `);
    console.log('user_id column:', colRes.rows);

  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    await client.end();
  }
}

run();
