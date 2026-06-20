import pg from 'pg';
import readline from 'readline';

const { Client } = pg;

const connectionString = 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n👑 Create Super Admin User via Direct PostgreSQL');
  console.log('================================================');

  const name = await askQuestion('Enter Full Name: ');
  const email = await askQuestion('Enter Email: ');
  const password = await askQuestion('Enter Password (min 6 chars): ');

  if (!name.trim() || !email.trim() || !password.trim()) {
    console.error('❌ All fields are required.');
    rl.close();
    return;
  }

  if (password.length < 6) {
    console.error('❌ Password must be at least 6 characters long.');
    rl.close();
    return;
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL database...');

    // Check if user already exists
    const checkUser = await client.query('SELECT id FROM auth.users WHERE email = $1', [email.trim().toLowerCase()]);
    if (checkUser.rows.length > 0) {
      console.error(`❌ User with email ${email} already exists.`);
      await client.end();
      rl.close();
      return;
    }

    console.log('Registering user in auth.users and generating bcrypt hash...');
    const userMeta = JSON.stringify({ name: name.trim(), role: 'superadmin' });
    
    const insertUserQuery = `
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        $1,
        extensions.crypt($2, extensions.gen_salt('bf', 10)),
        now(),
        '{"provider": "email", "providers": ["email"]}'::jsonb,
        $3::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
      ) RETURNING id;
    `;

    const res = await client.query(insertUserQuery, [
      email.trim().toLowerCase(),
      password,
      userMeta
    ]);

    const newUserId = res.rows[0].id;
    console.log(`✅ Auth user created successfully with ID: ${newUserId}`);

    // Wait a brief second to ensure trigger finished
    console.log('Verifying profile table entry...');
    const profileRes = await client.query('SELECT role FROM public.profiles WHERE id = $1', [newUserId]);
    
    if (profileRes.rows.length > 0) {
      console.log(`✅ Profile verified. Role: ${profileRes.rows[0].role}`);
    } else {
      console.log('⚠️ Profile trigger did not create row automatically. Creating manual profile...');
      await client.query(`
        INSERT INTO public.profiles (id, name, email, role, is_active, updated_at)
        VALUES ($1, $2, $3, 'superadmin', true, now())
      `, [newUserId, name.trim(), email.trim().toLowerCase()]);
      console.log('✅ Manual profile created successfully.');
    }

    console.log(`\n🎉 Done! Super admin account for ${email} is active and ready to log in.`);
  } catch (err) {
    console.error('\n❌ Error creating Super Admin:', err.message);
  } finally {
    await client.end();
    rl.close();
  }
}

main();
