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

async function test() {
  const { data: prod } = await supabase.from('products').select('id, name, price').limit(1).single();
  const prodId = prod ? prod.id : '00000000-0000-0000-0000-000000000000';
  
  const customOrderId = `00000000-0000-0000-0000-${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("")}`;
  console.log("Testing inserting guest order with customOrderId:", customOrderId, "Product ID:", prodId);
  
  const { data, error } = await supabase
    .from('orders')
    .insert({
      id: customOrderId,
      user_id: null,
      items: [{ product_id: prodId, name: prod?.name || 'Test Product', price: 100, quantity: 1 }],
      subtotal: 100,
      shipping_fee: 0,
      cod_fee: 60,
      total: 160,
      status: 'confirmed',
      payment_status: 'pending',
      order_status: 'confirmed',
      payment_method: 'cod',
      shipping_address: { name: 'Test Guest', email: 'guest@example.com', phone: '1234567890', addressLine: 'Test St', city: 'Test City', state: 'Test State', postalCode: '123456' }
    })
    .select()
    .single();

  if (error) {
    console.error('INSERT GUEST ORDER ERROR:', error);
  } else {
    console.log('INSERT GUEST ORDER SUCCESS! Order ID:', data.id);
    await supabase.from('orders').delete().eq('id', customOrderId);
  }
}

test();
