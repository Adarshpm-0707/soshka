import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Successfully connected to the PostgreSQL database.');

  // 1. Get all users
  const usersRes = await client.query('SELECT id, email, email_confirmed_at, created_at FROM auth.users');
  console.log(`\nFound ${usersRes.rows.length} users in database:`);
  
  for (const user of usersRes.rows) {
    console.log(`- Email: ${user.email} | Confirmed At: ${user.email_confirmed_at || 'NOT CONFIRMED'} | Created At: ${user.created_at}`);
  }

  // 2. Confirm emails for all unconfirmed users
  const unconfirmed = usersRes.rows.filter(u => !u.email_confirmed_at);
  if (unconfirmed.length === 0) {
    console.log('\nAll users are already confirmed! No updates needed.');
  } else {
    console.log(`\nConfirming emails for ${unconfirmed.length} unconfirmed users...`);
    for (const user of unconfirmed) {
      // Update auth.users
      await client.query(
        'UPDATE auth.users SET email_confirmed_at = now(), updated_at = now() WHERE id = $1',
        [user.id]
      );
      
      // Update auth.identities if exists
      const identCheck = await client.query(
        'SELECT id FROM auth.identities WHERE user_id = $1',
        [user.id]
      );
      if (identCheck.rows.length > 0) {
        await client.query(
          `UPDATE auth.identities SET 
            identity_data = identity_data || '{"email_verified": true}'::jsonb,
            updated_at = now()
           WHERE user_id = $1`,
          [user.id]
        );
      }
      console.log(`✅ Confirmed email for: ${user.email}`);
    }
    console.log('\nAll unconfirmed users have been confirmed successfully!');
  }

  await client.end();
}

main().catch((err) => {
  console.error('Error running confirmation script:', err);
  process.exit(1);
});
