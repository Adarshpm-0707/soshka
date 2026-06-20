async function run() {
  try {
    console.log('Sending request to http://localhost:3001/api/create-order...');
    const res = await fetch('http://localhost:3001/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount: 50000, currency: 'INR' })
    });
    console.log('STATUS:', res.status);
    console.log('HEADERS:', Object.fromEntries(res.headers.entries()));
    console.log('TEXT:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
run();
