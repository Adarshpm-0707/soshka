import pg from 'pg';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync('.env', 'utf8');
let dbUrl = '';
for (const line of envContent.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) {
    dbUrl = line.replace('DATABASE_URL=', '').trim();
    break;
  }
}

if (!dbUrl) {
  console.error('DATABASE_URL is not set in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database successfully.');
    
    const sqlPath = path.resolve('supabase/migrations/20260724050754_add_coupons_and_usage.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Running migration script...');
    await client.query(sql);
    console.log('SUCCESS: Migration applied to Supabase database!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
