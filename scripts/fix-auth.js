import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:Soshka%40007%40@db.bmbegjxfkpyenndfbcdj.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const EMAIL = 'adarshpm0707@gmail.com';
const PASSWORD = 'Soshka@007@';

async function main() {
  await client.connect();
  console.log('Connected.\n');

  // ── 1. Get ALL columns in auth.users to understand the full schema ──
  const schemaCols = await client.query(`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'auth' AND table_name = 'users'
    ORDER BY ordinal_position
  `);
  console.log('=== auth.users COLUMNS ===');
  schemaCols.rows.forEach(r => console.log(` ${r.column_name} (${r.data_type}) nullable=${r.is_nullable}`));

  // ── 2. Get current user record ──
  const userRes = await client.query(`SELECT * FROM auth.users WHERE email = $1`, [EMAIL]);
  if (userRes.rows.length === 0) {
    console.log('\nUSER NOT FOUND — must re-create.');
    await client.end();
    return;
  }

  const u = userRes.rows[0];
  const userId = u.id;
  console.log('\n=== CURRENT USER RECORD ===');
  // Show only fields relevant to auth flow
  const relevant = ['id','email','aud','role','email_confirmed_at','confirmation_token',
    'recovery_token','phone','is_sso_user','is_anonymous','banned_until','deleted_at',
    'reauthentication_token','email_change_confirm_status','last_sign_in_at'];
  relevant.forEach(f => console.log(` ${f}: ${JSON.stringify(u[f])}`));

  // ── 3. Fix all required GoTrue fields ──
  console.log('\n=== APPLYING COMPREHENSIVE FIX ===');

  // Build the UPDATE dynamically based on which columns exist
  const existingCols = new Set(schemaCols.rows.map(r => r.column_name));

  // Base fix — always apply these
  let fixSQL = `
    UPDATE auth.users SET
      aud = 'authenticated',
      role = 'authenticated',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      deleted_at = NULL,
      banned_until = NULL,
      updated_at = now()
  `;

  // Optional columns that may exist depending on GoTrue version
  if (existingCols.has('phone')) {
    fixSQL += `, phone = COALESCE(phone, '')`;
  }
  if (existingCols.has('phone_confirmed_at')) {
    fixSQL += `, phone_confirmed_at = phone_confirmed_at`; // leave as-is
  }
  if (existingCols.has('email_change_confirm_status')) {
    fixSQL += `, email_change_confirm_status = 0`;
  }
  if (existingCols.has('reauthentication_token')) {
    fixSQL += `, reauthentication_token = ''`;
  }
  if (existingCols.has('email_change_token_current')) {
    fixSQL += `, email_change_token_current = ''`;
  }
  if (existingCols.has('email_change_token_new')) {
    fixSQL += `, email_change_token_new = ''`;
  }
  if (existingCols.has('email_change')) {
    fixSQL += `, email_change = ''`;
  }
  if (existingCols.has('is_super_admin')) {
    fixSQL += `, is_super_admin = false`;
  }

  // Re-hash password with cost=10 (GoTrue default) instead of default pg cost=8
  fixSQL += `, encrypted_password = crypt($1, gen_salt('bf', 10))`;
  fixSQL += ` WHERE id = $2`;

  await client.query(fixSQL, [PASSWORD, userId]);
  console.log('auth.users patched with all required GoTrue fields!');

  // ── 4. Fix auth.identities ──
  const identCheck = await client.query(
    `SELECT id FROM auth.identities WHERE user_id = $1`, [userId]
  );
  
  if (identCheck.rows.length === 0) {
    console.log('Inserting missing auth.identities row...');
    await client.query(`
      INSERT INTO auth.identities (
        id, user_id, identity_data, provider,
        last_sign_in_at, created_at, updated_at, provider_id
      ) VALUES (
        $1::uuid, $1::uuid,
        jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
        'email', now(), now(), now(), $2::text
      )
    `, [userId, EMAIL]);
    console.log('auth.identities row created!');
  } else {
    console.log('Updating auth.identities...');
    await client.query(`
      UPDATE auth.identities SET
        identity_data = jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true),
        updated_at = now()
      WHERE user_id = $1::uuid
    `, [userId, EMAIL]);
    console.log('auth.identities updated!');
  }

  // ── 5. Ensure profile is correct ──
  await client.query(`
    INSERT INTO public.profiles (id, name, email, role, is_active, updated_at)
    VALUES ($1, 'Adarsh P M', $2, 'superadmin', true, now())
    ON CONFLICT (id) DO UPDATE
      SET role = 'superadmin', is_active = true, updated_at = now()
  `, [userId, EMAIL]);
  console.log('Profile confirmed as superadmin!');

  // ── 6. Schema reload ──
  await client.query(`NOTIFY pgrst, 'reload schema'`);
  await client.query(`NOTIFY pgrst, 'reload config'`);
  console.log('PostgREST schema cache refreshed!');

  // ── 7. Verify final state ──
  const finalUser = await client.query(
    `SELECT id, email, aud, role, email_confirmed_at, deleted_at, banned_until FROM auth.users WHERE id = $1`,
    [userId]
  );
  const finalProfile = await client.query(
    `SELECT id, email, role, is_active FROM public.profiles WHERE id = $1`,
    [userId]
  );

  console.log('\n=== FINAL STATE ===');
  console.log('auth.users:', JSON.stringify(finalUser.rows[0], null, 2));
  console.log('profile:   ', JSON.stringify(finalProfile.rows[0], null, 2));

  console.log('\n✅ ALL FIXED!');
  console.log('Login at /superadmin/login with:');
  console.log('  Email:   ', EMAIL);
  console.log('  Password:', PASSWORD);

  await client.end();
}

main().catch((err) => {
  console.error('Script error:', err.message);
  process.exit(1);
});
