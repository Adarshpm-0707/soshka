const SUPABASE_URL = 'https://bmbegjxfkpyenndfbcdj.supabase.co';
const ANON_KEY = 'sb_publishable_fNj9Or2qOPMIfOtWKETgTg__5YiqUJb';

async function testInvoke() {
  console.log(`Invoking send-order-email Edge Function at: ${SUPABASE_URL}/functions/v1/send-order-email`);
  
  const payload = {
    order_id: '00000000-0000-0000-0000-967201031700'
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-order-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(payload),
    });

    console.log(`Response Status: ${res.status} ${res.statusText}`);
    console.log('Response Headers:');
    res.headers.forEach((val, key) => console.log(`  ${key}: ${val}`));

    const text = await res.text();
    console.log('\nResponse Body:');
    console.log(text);
  } catch (err) {
    console.error('❌ Invoke Failed:', err);
  }
}

testInvoke();
