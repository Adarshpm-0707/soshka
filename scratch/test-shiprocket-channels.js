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

async function getChannels() {
  const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const { token } = await authRes.json();

  const channelsRes = await fetch('https://apiv2.shiprocket.in/v1/external/channels', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  const channelsData = await channelsRes.json();
  console.log("Registered Channels in Shiprocket:");
  console.log(JSON.stringify(channelsData, null, 2));
}

getChannels();
