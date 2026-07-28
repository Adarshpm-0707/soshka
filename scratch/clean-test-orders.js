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

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectAndCleanTestOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, created_at, status, total, shipping_address, items');

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log(`Total orders in DB: ${orders.length}`);

  const testOrders = [];
  const realOrders = [];

  for (const order of orders) {
    const email = (order.shipping_address?.email || '').toLowerCase();
    const name = (order.shipping_address?.name || '').toLowerCase();
    const id = (order.id || '').toLowerCase();
    
    const isTest = 
      email.includes('test') || 
      name.includes('test') || 
      id.includes('test') || 
      email.includes('example.com') ||
      name === 'customer' ||
      email === 'customer@soshka.in';

    if (isTest) {
      testOrders.push(order);
    } else {
      realOrders.push(order);
    }
  }

  console.log(`Test Orders Count: ${testOrders.length}`);
  console.log("Test Orders list:", testOrders.map(o => ({ id: o.id, name: o.shipping_address?.name, email: o.shipping_address?.email, status: o.status })));

  console.log(`Real Customer Orders Count: ${realOrders.length}`);
  console.log("Real Orders list:", realOrders.map(o => ({ id: o.id, name: o.shipping_address?.name, email: o.shipping_address?.email, status: o.status })));

  if (testOrders.length > 0) {
    const testIds = testOrders.map(o => o.id);
    console.log(`Deleting ${testIds.length} test order records...`);
    const { error: delError } = await supabase
      .from('orders')
      .delete()
      .in('id', testIds);

    if (delError) {
      console.error("Error deleting test orders:", delError.message);
    } else {
      console.log(`Successfully deleted ${testIds.length} test order records from database!`);
    }
  }
}

inspectAndCleanTestOrders();
