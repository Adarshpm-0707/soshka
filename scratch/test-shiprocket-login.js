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

console.log("Testing Shiprocket login with email:", email, "Password length:", password.length);

async function test() {
  try {
    const authRes = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    console.log("Status:", authRes.status);
    const data = await authRes.json();
    console.log("Response:", data);
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
