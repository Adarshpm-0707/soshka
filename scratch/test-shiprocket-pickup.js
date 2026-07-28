import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf8');
let email = '';
let password = '';

for (const line of envContent.split('\n')) {
  if (line.startsWith('SHIPROCKET_EMAIL=')) {
    email = line.replace('SHIPROCKET_EMAIL=', '').trim();
  }
  if (line.startsWith('SHIPROCKET_PASSWORD=')) {
    password = line.replace('SHIPROCKET_PASSWORD=', '').trim();
  }
}

async function getPickupLocations() {
  try {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { token } = await authRes.json();
    console.log("Authenticated successfully! Token received.");

    const pickupRes = await fetch('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const pickupData = await pickupRes.json();
    console.log("Pickup Locations Response:", JSON.stringify(pickupData, null, 2));
  } catch (err) {
    console.error("Error fetching pickup locations:", err);
  }
}

getPickupLocations();
