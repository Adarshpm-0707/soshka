import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmbegjxfkpyenndfbcdj.supabase.co';
const supabaseKey = 'sb_publishable_fNj9Or2qOPMIfOtWKETgTg__5YiqUJb';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
  try {
    console.log('Testing insert of null name and comment...');
    const { data, error } = await supabase
      .from('store_reviews')
      .insert({
        name: null,
        location: 'Test Location',
        rating: 5,
        comment: null,
        image_url: null,
        platform: 'other'
      })
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
    } else {
      console.log('Insert Succeeded!', data);
      
      // Clean up test insert
      if (data && data.length > 0) {
        const { error: delError } = await supabase
          .from('store_reviews')
          .delete()
          .eq('id', data[0].id);
        if (delError) console.error('Cleanup failed:', delError);
        else console.log('Cleanup succeeded.');
      }
    }
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

testInsert();
