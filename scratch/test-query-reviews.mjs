import { supabase } from '../src/lib/supabaseClient.js';

async function testQuery() {
  try {
    const { data, error } = await supabase
      .from('store_reviews')
      .select('*');
      
    if (error) {
      console.error('Supabase Query Error:', error);
      return;
    }
    console.log('Query Succeeded!');
    console.log('Count:', data?.length);
    console.log('Sample data:', data);
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

testQuery();
