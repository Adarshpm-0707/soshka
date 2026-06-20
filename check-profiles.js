import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Successfully connected to the PostgreSQL database.');

  // Get all users and their profile details
  const query = `
    SELECT 
      u.id, 
      u.email, 
      u.email_confirmed_at,
      p.name, 
      p.role, 
      p.is_active 
    FROM auth.users u
    LEFT JOIN public.profiles p ON u.id = p.id
    ORDER BY u.created_at DESC
  `;
  
  const res = await client.query(query);
  console.log('\nUser and Profile list:');
  for (const row of res.rows) {
    console.log(`- Email: ${row.email}
    Name: ${row.name || 'N/A'}
    Role: ${row.role || 'No Profile'}
    Active: ${row.is_active !== null ? row.is_active : 'N/A'}
    Email Confirmed: ${row.email_confirmed_at ? 'Yes' : 'No'}
    User ID: ${row.id}
    `);
  }

  await client.end();
}

main().catch(console.error);
