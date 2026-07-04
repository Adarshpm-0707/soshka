import { supabase } from '../src/lib/supabaseClient.js';

async function inspectTable() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Inspection Error:', error);
      return;
    }
    
    console.log('Order columns found:');
    if (data && data.length > 0) {
      console.log(Object.keys(data[0]));
      console.log('Sample order:', data[0]);
    } else {
      console.log('No orders found to inspect, but table exists.');
    }
  } catch (err) {
    console.error('Execution Error:', err);
  }
}

inspectTable();
