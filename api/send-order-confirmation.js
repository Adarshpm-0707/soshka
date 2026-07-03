import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Helper to load fallback environment variables locally
function loadEnvFallback() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error loading fallback .env:', err);
  }
}

// Helper to parse request body
async function getRequestBody(req) {
  if (req.body) {
    return typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', err => reject(err));
  });
}

// Helper to send JSON responses
function sendResponse(res, statusCode, data) {
  if (typeof res.status === 'function') {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Format currency in Indian Rupees
function formatINR(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(value);
}

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  loadEnvFallback();

  try {
    const body = await getRequestBody(req);
    const { order, email } = body;

    if (!order) {
      return sendResponse(res, 400, { error: 'Order details are required' });
    }

    let customerEmail = email;
    if (!customerEmail && order.shipping_address?.email) {
      customerEmail = order.shipping_address.email;
      console.log('Found customer email from order.shipping_address:', customerEmail);
    }
    if (!customerEmail && order.user_id) {
      console.log('Email not provided in body. Querying database for user email...');
      const pgConnectionString = process.env.DATABASE_URL;
      if (pgConnectionString) {
        try {
          const { Client } = await import('pg');
          const dbClient = new Client({
            connectionString: pgConnectionString,
            ssl: { rejectUnauthorized: false }
          });
          await dbClient.connect();
          
          // Try to fetch from profiles first
          const profileRes = await dbClient.query('SELECT email FROM public.profiles WHERE id = $1', [order.user_id]);
          if (profileRes.rows && profileRes.rows[0]?.email) {
            customerEmail = profileRes.rows[0].email;
            console.log('Found customer email from public.profiles:', customerEmail);
          } else {
            // Try to fetch from auth.users (requires DB access privileges)
            const userRes = await dbClient.query('SELECT email FROM auth.users WHERE id = $1', [order.user_id]);
            if (userRes.rows && userRes.rows[0]?.email) {
              customerEmail = userRes.rows[0].email;
              console.log('Found customer email from auth.users:', customerEmail);
            }
          }
          await dbClient.end();
        } catch (dbErr) {
          console.error('Error fetching user email from DB:', dbErr);
        }
      }
    }

    if (!customerEmail) {
      return sendResponse(res, 400, { error: 'Customer email address is required' });
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Verify SMTP settings
    if (!host || !user || !pass) {
      console.warn('SMTP configuration is missing.');
      return sendResponse(res, 400, {
        error: 'SMTP credentials are not fully configured in your environment.'
      });
    }

    // Recalculate calculations to verify invoice splits
    const items = order.items || [];
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Use imported constants equivalent logic
    const SHIPPING_CHARGES = 150;
    const FREE_SHIPPING_THRESHOLD = 2500;
    const TAX_RATE = 0.18;

    const shippingCost = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGES : 0;
    const taxCost = subtotal * TAX_RATE;

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Build the premium themed Sõshka Order Invoice
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #fafafa;
            margin: 0;
            padding: 0;
            color: #262626;
          }
          .email-container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border: 1px solid #eaeaea;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          }
          .brand-header {
            background-color: #98183f;
            background-image: linear-gradient(135deg, #98183f 0%, #640f28 100%);
            padding: 30px;
            text-align: center;
          }
          .brand-name {
            font-size: 28px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: 4px;
            text-transform: uppercase;
            margin: 0;
          }
          .brand-subtitle {
            font-size: 11px;
            font-weight: 600;
            color: #f7a0b9;
            letter-spacing: 2px;
            text-transform: uppercase;
            margin: 5px 0 0 0;
          }
          .invoice-body {
            padding: 35px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 8px;
            color: #1a1a1a;
          }
          .order-status-banner {
            background-color: #fdf2f5;
            border-left: 4px solid #ff2a85;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 600;
            color: #98183f;
          }
          .meta-table {
            width: 100%;
            margin-bottom: 25px;
            font-size: 12px;
            border-bottom: 1px solid #eaeaea;
            padding-bottom: 15px;
          }
          .meta-label {
            color: #8c8c8c;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            width: 30%;
          }
          .meta-value {
            color: #262626;
            font-weight: 600;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-header {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 800;
            color: #8c8c8c;
            border-bottom: 2px solid #eaeaea;
            padding-bottom: 10px;
            text-align: left;
          }
          .item-row td {
            padding: 15px 0;
            border-bottom: 1px solid #f5f5f5;
            font-size: 13px;
            font-weight: 600;
          }
          .item-name {
            color: #1a1a1a;
            font-weight: 700;
          }
          .item-meta {
            font-size: 11px;
            color: #8c8c8c;
            font-weight: 500;
            margin-top: 4px;
          }
          .calculation-section {
            width: 100%;
            margin-top: 15px;
          }
          .calculation-row td {
            padding: 8px 0;
            font-size: 13px;
            font-weight: 600;
          }
          .calculation-label {
            color: #8c8c8c;
            text-align: right;
            padding-right: 25px;
          }
          .calculation-val {
            text-align: right;
            width: 25%;
            color: #262626;
          }
          .total-row td {
            border-top: 2px solid #eaeaea;
            padding-top: 15px !important;
            font-size: 16px !important;
            font-weight: 800 !important;
          }
          .total-row .calculation-label {
            color: #1a1a1a;
          }
          .total-row .calculation-val {
            color: #98183f;
          }
          .address-card {
            background-color: #fcfcfc;
            border: 1px solid #f0f0f0;
            border-radius: 8px;
            padding: 20px;
            margin-top: 30px;
            font-size: 12px;
            line-height: 1.6;
          }
          .address-title {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #8c8c8c;
            margin-bottom: 10px;
            margin-top: 0;
          }
          .brand-footer {
            background-color: #f7f7f7;
            border-top: 1px solid #eaeaea;
            padding: 25px;
            text-align: center;
            font-size: 11px;
            color: #8c8c8c;
            font-weight: 500;
          }
          .brand-footer a {
            color: #98183f;
            text-decoration: none;
            font-weight: 650;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="brand-header">
            <h1 class="brand-name">Sõshka</h1>
            <p class="brand-subtitle">Fine Jewellery</p>
          </div>
          
          <div class="invoice-body">
            <h2 class="greeting">Thank You for Your Order!</h2>
            <p style="font-size: 13px; color: #666; margin: 0 0 20px 0; line-height: 1.5;">
              We have received your purchase request. Our artisans are preparing your selected items with care. You can find your order receipt details outlined below:
            </p>
            
            <div class="order-status-banner">
              Your order confirmation status is currently: <strong>PROCESSING</strong>
            </div>

            <table class="meta-table">
              <tr>
                <td class="meta-label">Order Number</td>
                <td class="meta-value">${order.id}</td>
              </tr>
              <tr>
                <td class="meta-label">Date Placed</td>
                <td class="meta-value">${new Date(order.created_at || Date.now()).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
              </tr>
              <tr>
                <td class="meta-label">Transaction ID</td>
                <td class="meta-value" style="font-family: monospace;">${order.payment_id || 'Cash on Delivery'}</td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr>
                  <th class="items-header" style="width: 60%;">Jewelry Item</th>
                  <th class="items-header" style="width: 15%; text-align: center;">Qty</th>
                  <th class="items-header" style="width: 25%; text-align: right;">Total Price</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr class="item-row">
                    <td>
                      <span class="item-name">${item.name}</span>
                      <div class="item-meta">
                        Unit Price: ${formatINR(item.price)}
                        ${item.size ? ` | Size: <strong>${item.size}</strong>` : ''}
                      </div>
                    </td>
                    <td style="text-align: center; color: #666;">${item.quantity}</td>
                    <td style="text-align: right; color: #1a1a1a;">${formatINR(item.price * item.quantity)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <table class="calculation-section">
              <tr class="calculation-row">
                <td class="calculation-label">Subtotal</td>
                <td class="calculation-val">${formatINR(subtotal)}</td>
              </tr>
              ${shippingCost > 0 ? `
                <tr class="calculation-row">
                  <td class="calculation-label">Shipping Charges</td>
                  <td class="calculation-val">${formatINR(shippingCost)}</td>
                </tr>
              ` : `
                <tr class="calculation-row">
                  <td class="calculation-label">Shipping Charges</td>
                  <td class="calculation-val" style="color: #10b981; font-weight: 700;">FREE</td>
                </tr>
              `}
              <tr class="calculation-row">
                <td class="calculation-label">GST (18%)</td>
                <td class="calculation-val">${formatINR(taxCost)}</td>
              </tr>
              <tr class="calculation-row total-row">
                <td class="calculation-label">Total Amount Paid</td>
                <td class="calculation-val">${formatINR(order.total)}</td>
              </tr>
            </table>

            <div class="address-card">
              <h4 class="address-title">📍 Dispatch Address</h4>
              <strong style="color: #1a1a1a; font-size: 13px;">${order.shipping_address?.name}</strong><br />
              ${order.shipping_address?.addressLine || order.shipping_address?.line1}<br />
              ${order.shipping_address?.city}, ${order.shipping_address?.state} - ${order.shipping_address?.postalCode || order.shipping_address?.postal_code}<br />
              Contact: ${order.shipping_address?.phone}
            </div>
          </div>
          
          <div class="brand-footer">
            <p>If you have any questions, please contact our custom service desk at <a href="mailto:support@soshka.in">support@soshka.in</a></p>
            <p style="margin-top: 15px; font-size: 10px; color: #b5b5b5;">&copy; ${new Date().getFullYear()} Sõshka Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Define mail options
    const mailOptions = {
      from: `"Sõshka Jewellery" <${user}>`,
      to: customerEmail,
      subject: `Order Confirmed - Invoice #${order.id.slice(0, 8).toUpperCase()}`,
      text: `Thank you for your purchase from Sõshka Store!\n\nOrder Number: ${order.id}\nTotal Amount Paid: ${formatINR(order.total)}\n\nThank you for shopping with us!`,
      html: htmlContent,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Simulate WhatsApp backend notification logging
    console.log(`[WhatsApp Notification Queued] Message: "Dear ${order.shipping_address?.name}, your Sõshka order #${order.id.slice(0, 8)} of ${formatINR(order.total)} is confirmed." sent to ${order.shipping_address?.phone}`);

    return sendResponse(res, 200, { success: true, message: 'Email invoice sent successfully' });
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return sendResponse(res, 500, { error: error.message || 'Failed to send email confirmation' });
  }
}
