/**
 * Reset passwords for ALL superadmin accounts to a known password.
 * Also prints a summary of all accounts.
 */
import pg from 'pg';
const { Client } = pg;

const NEW_PASSWORD = 'Soshka@Admin2024'; // Single known password for all superadmins

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

await client.connect();
console.log('✅ Connected to database\n');

// Get all users with their roles
const res = await client.query(`
  SELECT u.id, u.email, p.role, p.is_active, u.email_confirmed_at IS NOT NULL as confirmed
  FROM auth.users u
  LEFT JOIN public.profiles p ON u.id = p.id
  ORDER BY p.role, u.created_at DESC
`);

console.log('All accounts:');
for (const r of res.rows) {
  console.log(`  ${r.email} | role: ${r.role || 'user'} | confirmed: ${r.confirmed}`);
}

// Reset password for ALL superadmin accounts
const superadmins = res.rows.filter(r => r.role === 'superadmin');
console.log(`\nResetting password for ${superadmins.length} superadmin account(s)...`);

for (const sa of superadmins) {
  await client.query(
    `UPDATE auth.users 
     SET encrypted_password = crypt($1, gen_salt('bf')),
         updated_at = now()
     WHERE id = $2`,
    [NEW_PASSWORD, sa.id]
  );
  console.log(`  ✅ Reset: ${sa.email}`);
}

// Also reset admin accounts
const admins = res.rows.filter(r => r.role === 'admin');
console.log(`\nResetting password for ${admins.length} admin account(s)...`);
for (const a of admins) {
  await client.query(
    `UPDATE auth.users 
     SET encrypted_password = crypt($1, gen_salt('bf')),
         updated_at = now()
     WHERE id = $2`,
    [NEW_PASSWORD, a.id]
  );
  console.log(`  ✅ Reset: ${a.email}`);
}

console.log(`
========================================
✅ ALL PASSWORDS RESET SUCCESSFULLY
========================================

📋 Login Credentials:

SUPER ADMIN accounts:`);
superadmins.forEach(sa => console.log(`  Email: ${sa.email}`));
console.log(`  Password: ${NEW_PASSWORD}

ADMIN accounts:`);
admins.forEach(a => console.log(`  Email: ${a.email}`));
console.log(`  Password: ${NEW_PASSWORD}

📌 Login URLs:
  Super Admin: /superadmin/login
  Admin:       /admin/login
`);

await client.end();
