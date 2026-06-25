/**
 * Reset password for a specific Supabase user via direct DB connection.
 * Uses Supabase's built-in crypt() function to hash the new password.
 */
import pg from 'pg';
const { Client } = pg;

const TARGET_EMAIL = 'abdu543@gmail.com';
const NEW_PASSWORD = 'Soshka@2024'; // New password to set

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('✅ Connected to database\n');

// Check user exists
const userRes = await client.query(
  `SELECT id, email, email_confirmed_at FROM auth.users WHERE email = $1`,
  [TARGET_EMAIL]
);

if (userRes.rows.length === 0) {
  console.log(`❌ No user found with email: ${TARGET_EMAIL}`);
  await client.end();
  process.exit(1);
}

const user = userRes.rows[0];
console.log(`Found user: ${user.email}`);
console.log(`Email confirmed: ${user.email_confirmed_at ? 'Yes ✅' : 'No ❌'}`);

// Reset password using Supabase's crypt function
// Supabase stores passwords as: crypt(password, gen_salt('bf'))
await client.query(
  `UPDATE auth.users 
   SET encrypted_password = crypt($1, gen_salt('bf')),
       updated_at = now()
   WHERE id = $2`,
  [NEW_PASSWORD, user.id]
);

console.log(`\n✅ Password reset successfully for: ${TARGET_EMAIL}`);
console.log(`   New password: ${NEW_PASSWORD}`);
console.log('\n📌 You can now log in at /superadmin/login with these credentials.');

await client.end();
