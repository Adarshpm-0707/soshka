import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log("Connected to database. Fetching auth user...");

  // 1. Find user in auth.users
  const userRes = await client.query("SELECT id, email FROM auth.users WHERE email = 'adarshpm0707@gmail.com'");
  
  if (userRes.rows.length === 0) {
    console.log("ERROR: User with email adarshpm0707@gmail.com not found in auth.users.");
    await client.end();
    return;
  }

  const userId = userRes.rows[0].id;
  console.log(`User found in auth.users with ID: ${userId}`);

  // 2. Check if profile exists
  const profileRes = await client.query("SELECT * FROM public.profiles WHERE id = $1", [userId]);

  if (profileRes.rows.length === 0) {
    console.log("Profile row is missing. Creating new profile with admin role...");
    await client.query(
      "INSERT INTO public.profiles (id, name, email, role) VALUES ($1, $2, $3, $4)",
      [userId, 'Adarsh', 'adarshpm0707@gmail.com', 'admin']
    );
    console.log("SUCCESS: Created profile row with admin role!");
  } else {
    console.log("Profile row exists. Updating role to admin...");
    await client.query("UPDATE public.profiles SET role = 'admin' WHERE id = $1", [userId]);
    console.log("SUCCESS: Promoted existing profile to admin!");
  }

  await client.end();
}

main().catch(console.error);
