import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('✅ Connected to Postgres database');

  const filesToExecute = [
    '../database/fix_superadmin.sql',
    '../database/fix_register_user_directly.sql'
  ];

  for (const file of filesToExecute) {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ File not found: ${filePath}`);
      continue;
    }

    console.log(`\n📄 Executing file: ${path.basename(file)}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await client.query(sql);
      console.log(`  ✅ Successfully executed ${path.basename(file)}`);
    } catch (err) {
      console.error(`  ❌ Execution failed: ${path.basename(file)}`);
      console.error(`     Reason: ${err.message}`);
    }
  }

  // Quick verification query to verify function is in the database
  const { rows } = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name = 'register_user_directly'
  `);
  
  if (rows.length > 0) {
    console.log('\n🎉 Function public.register_user_directly exists in the database schema!');
  } else {
    console.error('\n❌ Function public.register_user_directly was NOT found in the schema after execution.');
  }

  await client.end();
}

main().catch(err => {
  console.error('Fatal execution error:', err.message);
  process.exit(1);
});
