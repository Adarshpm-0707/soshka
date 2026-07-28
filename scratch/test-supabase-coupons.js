import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) {
    supabaseUrl = line.replace('VITE_SUPABASE_URL=', '').trim();
  }
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) {
    supabaseKey = line.replace('VITE_SUPABASE_PUBLISHABLE_KEY=', '').trim();
  }
}

console.log('Testing Supabase Client Query on coupons table...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('coupons').select('*');
  if (error) {
    console.error('SUPABASE API ERROR:', error);
  } else {
    console.log('SUPABASE API SUCCESS! Coupons data:', data);
  }
}

test();
