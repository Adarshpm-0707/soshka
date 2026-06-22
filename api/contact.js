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

export default async function handler(req, res) {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return sendResponse(res, 405, { error: 'Method not allowed' });
  }

  loadEnvFallback();

  try {
    const body = await getRequestBody(req);
    const { name, email, message } = body;

    if (!name || !email || !message) {
      return sendResponse(res, 400, { error: 'Name, email, and message are required fields' });
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.SMTP_TO || 'soshka.in@gmail.com';

    // Verify SMTP settings are configured and not placeholders
    if (!host || !user || !pass || pass === 'your-gmail-app-password') {
      console.warn('SMTP configuration is missing or using default placeholders.');
      return sendResponse(res, 400, {
        error: 'SMTP credentials are not fully configured in your environment. Please update SMTP_PASS in the .env file.'
      });
    }

    // Create a nodemailer transporter
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });

    // Create a beautiful HTML body
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">New Contact Form Inquiry</h2>
        <p style="font-size: 16px; line-height: 1.5; color: #1e293b;">
          You have received a new contact submission from your store website.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569; width: 120px;">Name:</td>
            <td style="padding: 8px 0; color: #0f172a;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
            <td style="padding: 8px 0; color: #0f172a;">
              <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none;">${email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #475569; vertical-align: top;">Message:</td>
            <td style="padding: 8px 0; color: #0f172a; white-space: pre-wrap; line-height: 1.5;">${message}</td>
          </tr>
        </table>
        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
          Sent automatically from Soshka Store Contact form.
        </div>
      </div>
    `;

    // Define mail options
    const mailOptions = {
      from: `"${name} (Soshka Store Contact)" <${user}>`,
      replyTo: email,
      to,
      subject: `[Soshka Store] Contact Request from ${name}`,
      text: `New Contact Request\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: htmlContent,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    return sendResponse(res, 200, { success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    return sendResponse(res, 500, { error: error.message || 'Failed to send email notification' });
  }
}
