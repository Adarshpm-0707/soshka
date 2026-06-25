/**
 * Test: After login, can we read our own profile from profiles table?
 * This simulates exactly what the React app does.
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bmbegjxfkpyenndfbcdj.supabase.co',
  'sb_publishable_fNj9Or2qOPMIfOtWKETgTg__5YiqUJb'
);

console.log('Step 1: Signing in...');
const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
  email: 'abdu543@gmail.com',
  password: 'Soshka@2024'
});

if (authError) {
  console.error('❌ Login failed:', authError.message, authError.code);
  process.exit(1);
}
console.log('✅ Logged in as:', authData.user.email);

console.log('\nStep 2: Fetching profile from profiles table...');
const { data: profile, error: profileError } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', authData.user.id)
  .single();

if (profileError) {
  console.error('❌ Profile fetch failed:', profileError.message, profileError.code);
  console.error('   This is likely the RLS issue - profile returns null after login!');
} else {
  console.log('✅ Profile fetched:', JSON.stringify(profile, null, 2));
}

console.log('\nStep 3: Checking isSuperAdmin logic...');
const isSuperAdmin = profile?.role === 'superadmin' && profile?.is_active !== false;
console.log('isSuperAdmin:', isSuperAdmin);

await supabase.auth.signOut();
