// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/@vitejs/plugin-react/dist/index.js";

// api/create-order.js
import Razorpay from "file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/razorpay/dist/razorpay.js";
import fs from "fs";
import path from "path";
function loadEnvFallback() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading fallback .env:", err);
  }
}
async function getRequestBody(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendResponse(res, statusCode, data) {
  if (typeof res.status === "function") {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
async function handler(req, res) {
  if (req.method !== "POST") {
    return sendResponse(res, 405, { error: "Method not allowed" });
  }
  loadEnvFallback();
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return sendResponse(res, 401, { error: "Razorpay keys not configured" });
  }
  try {
    const body = await getRequestBody(req);
    const { amount, currency = "INR", receipt } = body;
    const amountInt = parseInt(amount, 10);
    if (isNaN(amountInt) || amountInt < 100) {
      return sendResponse(res, 400, { error: "Amount must be at least 100 paise" });
    }
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });
    const options = {
      amount: amountInt,
      currency,
      receipt: receipt || `receipt_${Date.now()}`
    };
    const order = await razorpay.orders.create(options);
    return sendResponse(res, 200, {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    if (error.statusCode === 401) {
      return sendResponse(res, 401, { error: "Razorpay authentication failed" });
    }
    return sendResponse(res, 500, { error: error.message || "Internal server error" });
  }
}

// api/verify-payment.js
import crypto from "crypto";
import fs2 from "fs";
import path2 from "path";
function loadEnvFallback2() {
  try {
    const envPath = path2.join(process.cwd(), ".env");
    if (fs2.existsSync(envPath)) {
      const content = fs2.readFileSync(envPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading fallback .env:", err);
  }
}
async function getRequestBody2(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendResponse2(res, statusCode, data) {
  if (typeof res.status === "function") {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
async function handler2(req, res) {
  if (req.method !== "POST") {
    return sendResponse2(res, 405, { error: "Method not allowed" });
  }
  loadEnvFallback2();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return sendResponse2(res, 500, { error: "Razorpay secret key not configured" });
  }
  try {
    const body = await getRequestBody2(req);
    const { order_id, payment_id, signature } = body;
    if (!order_id || !payment_id || !signature) {
      return sendResponse2(res, 400, { error: "Missing required signature verification fields" });
    }
    const text = order_id + "|" + payment_id;
    const generatedSignature = crypto.createHmac("sha256", keySecret).update(text).digest("hex");
    if (generatedSignature === signature) {
      return sendResponse2(res, 200, { status: "ok", verified: true });
    } else {
      console.warn("Razorpay signature mismatch");
      return sendResponse2(res, 400, { status: "failed", error: "Payment signature mismatch" });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return sendResponse2(res, 500, { error: error.message || "Internal server error" });
  }
}

// api/contact.js
import nodemailer from "file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/nodemailer/lib/nodemailer.js";
import fs3 from "fs";
import path3 from "path";
function loadEnvFallback3() {
  try {
    const envPath = path3.join(process.cwd(), ".env");
    if (fs3.existsSync(envPath)) {
      const content = fs3.readFileSync(envPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading fallback .env:", err);
  }
}
async function getRequestBody3(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendResponse3(res, statusCode, data) {
  if (typeof res.status === "function") {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
async function handler3(req, res) {
  if (req.method !== "POST") {
    return sendResponse3(res, 405, { error: "Method not allowed" });
  }
  loadEnvFallback3();
  try {
    const body = await getRequestBody3(req);
    const { name, email, message } = body;
    if (!name || !email || !message) {
      return sendResponse3(res, 400, { error: "Name, email, and message are required fields" });
    }
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const to = process.env.SMTP_TO || "soshka.in@gmail.com";
    if (!host || !user || !pass || pass === "your-gmail-app-password") {
      console.warn("SMTP configuration is missing or using default placeholders.");
      return sendResponse3(res, 400, {
        error: "SMTP credentials are not fully configured in your environment. Please update SMTP_PASS in the .env file."
      });
    }
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      // true for 465, false for other ports
      auth: {
        user,
        pass
      }
    });
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
    const mailOptions = {
      from: `"${name} (Soshka Store Contact)" <${user}>`,
      replyTo: email,
      to,
      subject: `[Soshka Store] Contact Request from ${name}`,
      text: `New Contact Request

Name: ${name}
Email: ${email}
Message: ${message}`,
      html: htmlContent
    };
    await transporter.sendMail(mailOptions);
    return sendResponse3(res, 200, { success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    return sendResponse3(res, 500, { error: error.message || "Failed to send email notification" });
  }
}

// api/shiprocket-pickup.js
import pg from "file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/pg/esm/index.mjs";
import fs4 from "fs";
import path4 from "path";
var { Client } = pg;
function loadEnvFallback4() {
  try {
    const envPath = path4.join(process.cwd(), ".env");
    if (fs4.existsSync(envPath)) {
      const content = fs4.readFileSync(envPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading fallback .env:", err);
  }
}
async function getRequestBody4(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendResponse4(res, statusCode, data) {
  if (typeof res.status === "function") {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
async function handler4(req, res) {
  if (req.method !== "POST") {
    return sendResponse4(res, 405, { error: "Method not allowed" });
  }
  loadEnvFallback4();
  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;
  const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
  const channelId = process.env.SHIPROCKET_CHANNEL_ID;
  if (!email || !password || email === "your-shiprocket-email@domain.com") {
    console.warn("Shiprocket credentials are missing or default placeholders.");
    return sendResponse4(res, 400, {
      error: "Shiprocket credentials are not configured. Please update SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in your .env file."
    });
  }
  try {
    const body = await getRequestBody4(req);
    const { order, email: customerEmail } = body;
    if (!order || !order.id || !order.shipping_address || !order.items) {
      return sendResponse4(res, 400, { error: "Missing order details" });
    }
    const { shipping_address, items, total, id: orderUuid } = order;
    console.log("Authenticating with Shiprocket...");
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!authRes.ok) {
      const authError = await authRes.json();
      throw new Error(`Shiprocket auth failed: ${authError.message || authRes.statusText}`);
    }
    const { token } = await authRes.json();
    console.log("Shiprocket authenticated successfully.");
    const orderDate = new Date(order.created_at || Date.now()).toISOString().replace("T", " ").slice(0, 16);
    const nameParts = (shipping_address.name || "Customer").trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || ".";
    const orderItems = items.map((item, idx) => ({
      name: item.name || `Jewelry Item ${idx + 1}`,
      sku: item.product_id ? item.product_id.slice(0, 8) : `SKU-${idx}`,
      units: parseInt(item.quantity || "1", 10),
      selling_price: parseFloat(item.price || "0")
    }));
    const payload = {
      order_id: orderUuid.slice(0, 20),
      // Max 20 characters for typical Shiprocket ID
      order_date: orderDate,
      pickup_location: pickupLocation,
      channel_id: channelId ? parseInt(channelId, 10) : void 0,
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: shipping_address.addressLine || shipping_address.address || "Address Line 1",
      billing_city: shipping_address.city || "City",
      billing_pincode: parseInt(shipping_address.postalCode || "110001", 10),
      billing_state: shipping_address.state || "State",
      billing_country: "India",
      billing_email: customerEmail || "customer@soshka.in",
      billing_phone: shipping_address.phone ? shipping_address.phone.replace(/[^0-9]/g, "") : "9876543210",
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: "Prepaid",
      sub_total: parseFloat(total || "0"),
      length: 10,
      // cm (default package box size)
      breadth: 10,
      // cm
      height: 5,
      // cm
      weight: 0.2
      // kg
    };
    console.log("Sending order payload to Shiprocket...");
    const createOrderRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/create/adhoc", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    if (!createOrderRes.ok) {
      const createErrorMsg = await createOrderRes.text();
      console.error("Shiprocket order creation error response:", createErrorMsg);
      throw new Error(`Shiprocket order creation failed: ${createErrorMsg}`);
    }
    const createData = await createOrderRes.json();
    console.log("Shiprocket order created:", createData);
    let shipmentId = null;
    let awbCode = "";
    if (createData.shipment_id) {
      shipmentId = createData.shipment_id;
      awbCode = createData.awb_code || "";
    } else if (createData.data && createData.data.shipment_id) {
      shipmentId = createData.data.shipment_id;
      awbCode = createData.data.awb_code || "";
    } else if (createData.data && createData.data.data && Array.isArray(createData.data.data) && createData.data.data[0]) {
      shipmentId = createData.data.data[0].shipment_id;
      awbCode = createData.data.data[0].awb_code || "";
    } else if (createData.data && Array.isArray(createData.data) && createData.data[0]) {
      shipmentId = createData.data[0].shipment_id;
      awbCode = createData.data[0].awb_code || "";
    }
    if (!shipmentId) {
      if (createData.message) {
        throw new Error(`Shiprocket order creation failed: ${createData.message}`);
      }
      throw new Error(`Shiprocket did not return a shipment ID. Response: ${JSON.stringify(createData)}`);
    }
    console.log(`Scheduling pickup for shipment: ${shipmentId}...`);
    const pickupRes = await fetch("https://apiv2.shiprocket.in/v1/external/courier/generate/pickup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        shipment_id: [shipmentId]
      })
    });
    if (!pickupRes.ok) {
      const pickupError = await pickupRes.text();
      console.warn("Shiprocket pickup scheduling warning (might need manually approved/re-scheduled):", pickupError);
    } else {
      const pickupData = await pickupRes.json();
      console.log("Shiprocket pickup scheduled successfully:", pickupData);
    }
    console.log("Saving shipment details in local database...");
    const pgConnectionString = process.env.DATABASE_URL;
    if (!pgConnectionString) {
      throw new Error("DATABASE_URL is not configured in the environment.");
    }
    const dbClient = new Client({
      connectionString: pgConnectionString,
      ssl: { rejectUnauthorized: false }
    });
    await dbClient.connect();
    await dbClient.query(`
      UPDATE public.orders
      SET shiprocket_shipment_id = $1, shiprocket_awb = $2
      WHERE id = $3
    `, [String(shipmentId), String(awbCode), orderUuid]);
    await dbClient.end();
    console.log("Order shipment metadata updated in database successfully!");
    return sendResponse4(res, 200, {
      success: true,
      shipment_id: shipmentId,
      awb_code: awbCode
    });
  } catch (error) {
    console.error("Error handling Shiprocket integration:", error);
    return sendResponse4(res, 500, { error: error.message || "Internal Shiprocket server error" });
  }
}

// api/send-order-confirmation.js
import nodemailer2 from "file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/nodemailer/lib/nodemailer.js";
import fs5 from "fs";
import path5 from "path";
function loadEnvFallback5() {
  try {
    const envPath = path5.join(process.cwd(), ".env");
    if (fs5.existsSync(envPath)) {
      const content = fs5.readFileSync(envPath, "utf8");
      const lines = content.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#")) {
          const firstEqual = trimmed.indexOf("=");
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            const val = trimmed.slice(firstEqual + 1).trim();
            process.env[key] = val;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error loading fallback .env:", err);
  }
}
async function getRequestBody5(req) {
  if (req.body) {
    return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  }
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", (err) => reject(err));
  });
}
function sendResponse5(res, statusCode, data) {
  if (typeof res.status === "function") {
    return res.status(statusCode).json(data);
  }
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}
function formatINR(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2
  }).format(value);
}
async function handler5(req, res) {
  if (req.method !== "POST") {
    return sendResponse5(res, 405, { error: "Method not allowed" });
  }
  loadEnvFallback5();
  try {
    const body = await getRequestBody5(req);
    const { order, email } = body;
    if (!order) {
      return sendResponse5(res, 400, { error: "Order details are required" });
    }
    let customerEmail = email;
    if (!customerEmail && order.shipping_address?.email) {
      customerEmail = order.shipping_address.email;
      console.log("Found customer email from order.shipping_address:", customerEmail);
    }
    if (!customerEmail && order.user_id) {
      console.log("Email not provided in body. Querying database for user email...");
      const pgConnectionString = process.env.DATABASE_URL;
      if (pgConnectionString) {
        try {
          const { Client: Client2 } = await import("file:///C:/Users/abdul/Downloads/Soshka/Soshka/ecommerce-app/node_modules/pg/esm/index.mjs");
          const dbClient = new Client2({
            connectionString: pgConnectionString,
            ssl: { rejectUnauthorized: false }
          });
          await dbClient.connect();
          const profileRes = await dbClient.query("SELECT email FROM public.profiles WHERE id = $1", [order.user_id]);
          if (profileRes.rows && profileRes.rows[0]?.email) {
            customerEmail = profileRes.rows[0].email;
            console.log("Found customer email from public.profiles:", customerEmail);
          } else {
            const userRes = await dbClient.query("SELECT email FROM auth.users WHERE id = $1", [order.user_id]);
            if (userRes.rows && userRes.rows[0]?.email) {
              customerEmail = userRes.rows[0].email;
              console.log("Found customer email from auth.users:", customerEmail);
            }
          }
          await dbClient.end();
        } catch (dbErr) {
          console.error("Error fetching user email from DB:", dbErr);
        }
      }
    }
    if (!customerEmail) {
      return sendResponse5(res, 400, { error: "Customer email address is required" });
    }
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    if (!host || !user || !pass) {
      console.warn("SMTP configuration is missing.");
      return sendResponse5(res, 400, {
        error: "SMTP credentials are not fully configured in your environment."
      });
    }
    const items = order.items || [];
    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const SHIPPING_CHARGES = 150;
    const FREE_SHIPPING_THRESHOLD = 2500;
    const TAX_RATE = 0.18;
    const shippingCost = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_CHARGES : 0;
    const taxCost = subtotal * TAX_RATE;
    const transporter = nodemailer2.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
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
            <h1 class="brand-name">S\xF5shka</h1>
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
                <td class="meta-value">${new Date(order.created_at || Date.now()).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</td>
              </tr>
              <tr>
                <td class="meta-label">Transaction ID</td>
                <td class="meta-value" style="font-family: monospace;">${order.payment_id || "Cash on Delivery"}</td>
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
                ${items.map((item) => `
                  <tr class="item-row">
                    <td>
                      <span class="item-name">${item.name}</span>
                      <div class="item-meta">
                        Unit Price: ${formatINR(item.price)}
                        ${item.size ? ` | Size: <strong>${item.size}</strong>` : ""}
                      </div>
                    </td>
                    <td style="text-align: center; color: #666;">${item.quantity}</td>
                    <td style="text-align: right; color: #1a1a1a;">${formatINR(item.price * item.quantity)}</td>
                  </tr>
                `).join("")}
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
              <h4 class="address-title">\u{1F4CD} Dispatch Address</h4>
              <strong style="color: #1a1a1a; font-size: 13px;">${order.shipping_address?.name}</strong><br />
              ${order.shipping_address?.addressLine || order.shipping_address?.line1}<br />
              ${order.shipping_address?.city}, ${order.shipping_address?.state} - ${order.shipping_address?.postalCode || order.shipping_address?.postal_code}<br />
              Contact: ${order.shipping_address?.phone}
            </div>
          </div>
          
          <div class="brand-footer">
            <p>If you have any questions, please contact our custom service desk at <a href="mailto:support@soshka.in">support@soshka.in</a></p>
            <p style="margin-top: 15px; font-size: 10px; color: #b5b5b5;">&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} S\xF5shka Store. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    const mailOptions = {
      from: `"S\xF5shka Jewellery" <${user}>`,
      to: customerEmail,
      subject: `Order Confirmed - Invoice #${order.id.slice(0, 8).toUpperCase()}`,
      text: `Thank you for your purchase from S\xF5shka Store!

Order Number: ${order.id}
Total Amount Paid: ${formatINR(order.total)}

Thank you for shopping with us!`,
      html: htmlContent
    };
    await transporter.sendMail(mailOptions);
    console.log(`[WhatsApp Notification Queued] Message: "Dear ${order.shipping_address?.name}, your S\xF5shka order #${order.id.slice(0, 8)} of ${formatINR(order.total)} is confirmed." sent to ${order.shipping_address?.phone}`);
    return sendResponse5(res, 200, { success: true, message: "Email invoice sent successfully" });
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return sendResponse5(res, 500, { error: error.message || "Failed to send email confirmation" });
  }
}

// vite.config.js
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.RAZORPAY_KEY_ID = env.RAZORPAY_KEY_ID;
  process.env.RAZORPAY_KEY_SECRET = env.RAZORPAY_KEY_SECRET;
  process.env.SMTP_HOST = env.SMTP_HOST;
  process.env.SMTP_PORT = env.SMTP_PORT;
  process.env.SMTP_USER = env.SMTP_USER;
  process.env.SMTP_PASS = env.SMTP_PASS;
  process.env.SMTP_TO = env.SMTP_TO;
  process.env.SHIPROCKET_EMAIL = env.SHIPROCKET_EMAIL;
  process.env.SHIPROCKET_PASSWORD = env.SHIPROCKET_PASSWORD;
  process.env.SHIPROCKET_PICKUP_LOCATION = env.SHIPROCKET_PICKUP_LOCATION;
  process.env.SHIPROCKET_CHANNEL_ID = env.SHIPROCKET_CHANNEL_ID;
  return {
    plugins: [
      react(),
      {
        name: "custom-api-middleware",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            console.log(`[Dev Server Middleware] Incoming request: ${req.method} ${req.url}`);
            if (req.url.startsWith("/api/create-order")) {
              try {
                await handler(req, res);
              } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            if (req.url.startsWith("/api/verify-payment")) {
              try {
                await handler2(req, res);
              } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            if (req.url.startsWith("/api/contact")) {
              try {
                await handler3(req, res);
              } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            if (req.url.startsWith("/api/shiprocket-pickup")) {
              try {
                await handler4(req, res);
              } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            if (req.url.startsWith("/api/send-order-confirmation")) {
              try {
                await handler5(req, res);
              } catch (err) {
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ error: err.message }));
              }
              return;
            }
            next();
          });
        }
      }
    ],
    server: {
      port: 3e3,
      strictPort: true,
      open: true,
      headers: {
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "X-XSS-Protection": "1; mode=block",
        "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://bmbegjxfkpyenndfbcdj.supabase.co wss://bmbegjxfkpyenndfbcdj.supabase.co https://api.razorpay.com; frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com;",
        "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
      }
    },
    build: {
      sourcemap: false,
      minify: "esbuild",
      chunkSizeWarningLimit: 1e3,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("three")) {
                return "vendor-three";
              }
              if (id.includes("gsap")) {
                return "vendor-gsap";
              }
              if (id.includes("lenis")) {
                return "vendor-lenis";
              }
              if (id.includes("@supabase") || id.includes("websocket")) {
                return "vendor-supabase";
              }
              if (id.includes("lucide-react")) {
                return "vendor-icons";
              }
              return "vendor-core";
            }
          }
        }
      }
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAiYXBpL2NyZWF0ZS1vcmRlci5qcyIsICJhcGkvdmVyaWZ5LXBheW1lbnQuanMiLCAiYXBpL2NvbnRhY3QuanMiLCAiYXBpL3NoaXByb2NrZXQtcGlja3VwLmpzIiwgImFwaS9zZW5kLW9yZGVyLWNvbmZpcm1hdGlvbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rvd25sb2Fkcy9Tb3Noa2EvU29zaGthL2Vjb21tZXJjZS1hcHAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IGNyZWF0ZU9yZGVySGFuZGxlciBmcm9tICcuL2FwaS9jcmVhdGUtb3JkZXIuanMnXG5pbXBvcnQgdmVyaWZ5UGF5bWVudEhhbmRsZXIgZnJvbSAnLi9hcGkvdmVyaWZ5LXBheW1lbnQuanMnXG5pbXBvcnQgY29udGFjdEhhbmRsZXIgZnJvbSAnLi9hcGkvY29udGFjdC5qcydcbmltcG9ydCBzaGlwcm9ja2V0UGlja3VwSGFuZGxlciBmcm9tICcuL2FwaS9zaGlwcm9ja2V0LXBpY2t1cC5qcydcbmltcG9ydCBzZW5kT3JkZXJDb25maXJtYXRpb25IYW5kbGVyIGZyb20gJy4vYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uLmpzJ1xuXG4vLyBUcmlnZ2VyIGRldiBzZXJ2ZXIgbWlkZGxld2FyZSByZWxvYWQgdG8gcmVmcmVzaCBFUyBtb2R1bGVzIChlbWFpbCBmYWxsYmFjayBwcmlvcml0aXphdGlvbiB1cGRhdGUpXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgLy8gUG9wdWxhdGUgcHJvY2Vzcy5lbnYgc28gYmFja2VuZCBmdW5jdGlvbnMgY2FuIGFjY2VzcyBjcmVkZW50aWFsc1xuICBwcm9jZXNzLmVudi5SQVpPUlBBWV9LRVlfSUQgPSBlbnYuUkFaT1JQQVlfS0VZX0lEO1xuICBwcm9jZXNzLmVudi5SQVpPUlBBWV9LRVlfU0VDUkVUID0gZW52LlJBWk9SUEFZX0tFWV9TRUNSRVQ7XG4gIHByb2Nlc3MuZW52LlNNVFBfSE9TVCA9IGVudi5TTVRQX0hPU1Q7XG4gIHByb2Nlc3MuZW52LlNNVFBfUE9SVCA9IGVudi5TTVRQX1BPUlQ7XG4gIHByb2Nlc3MuZW52LlNNVFBfVVNFUiA9IGVudi5TTVRQX1VTRVI7XG4gIHByb2Nlc3MuZW52LlNNVFBfUEFTUyA9IGVudi5TTVRQX1BBU1M7XG4gIHByb2Nlc3MuZW52LlNNVFBfVE8gPSBlbnYuU01UUF9UTztcbiAgcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9FTUFJTCA9IGVudi5TSElQUk9DS0VUX0VNQUlMO1xuICBwcm9jZXNzLmVudi5TSElQUk9DS0VUX1BBU1NXT1JEID0gZW52LlNISVBST0NLRVRfUEFTU1dPUkQ7XG4gIHByb2Nlc3MuZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OID0gZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OO1xuICBwcm9jZXNzLmVudi5TSElQUk9DS0VUX0NIQU5ORUxfSUQgPSBlbnYuU0hJUFJPQ0tFVF9DSEFOTkVMX0lEO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ2N1c3RvbS1hcGktbWlkZGxld2FyZScsXG4gICAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtEZXYgU2VydmVyIE1pZGRsZXdhcmVdIEluY29taW5nIHJlcXVlc3Q6ICR7cmVxLm1ldGhvZH0gJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL2FwaS9jcmVhdGUtb3JkZXInKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZU9yZGVySGFuZGxlcihyZXEsIHJlcyk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL2FwaS92ZXJpZnktcGF5bWVudCcpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdmVyaWZ5UGF5bWVudEhhbmRsZXIocmVxLCByZXMpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvY29udGFjdCcpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29udGFjdEhhbmRsZXIocmVxLCByZXMpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvc2hpcHJvY2tldC1waWNrdXAnKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoaXByb2NrZXRQaWNrdXBIYW5kbGVyKHJlcSwgcmVzKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVxLnVybC5zdGFydHNXaXRoKCcvYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uJykpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25IYW5kbGVyKHJlcSwgcmVzKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdLFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1GcmFtZS1PcHRpb25zJzogJ0RFTlknLFxuICAgICAgICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcbiAgICAgICAgJ1JlZmVycmVyLVBvbGljeSc6ICdzdHJpY3Qtb3JpZ2luLXdoZW4tY3Jvc3Mtb3JpZ2luJyxcbiAgICAgICAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXG4gICAgICAgICdDb250ZW50LVNlY3VyaXR5LVBvbGljeSc6IFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovL2NoZWNrb3V0LnJhem9ycGF5LmNvbTsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbTsgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6OyBmb250LXNyYyAnc2VsZicgZGF0YTogaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTsgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOi8vYm1iZWdqeGZrcHllbm5kZmJjZGouc3VwYWJhc2UuY28gd3NzOi8vYm1iZWdqeGZrcHllbm5kZmJjZGouc3VwYWJhc2UuY28gaHR0cHM6Ly9hcGkucmF6b3JwYXkuY29tOyBmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOi8vYXBpLnJhem9ycGF5LmNvbSBodHRwczovL2NoZWNrb3V0LnJhem9ycGF5LmNvbTtcIixcbiAgICAgICAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdjYW1lcmE9KCksIG1pY3JvcGhvbmU9KCksIGdlb2xvY2F0aW9uPSgpLCBpbnRlcmVzdC1jb2hvcnQ9KCknXG4gICAgICB9XG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd0aHJlZScpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItdGhyZWUnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZ3NhcCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItZ3NhcCc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsZW5pcycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItbGVuaXMnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykgfHwgaWQuaW5jbHVkZXMoJ3dlYnNvY2tldCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3Itc3VwYWJhc2UnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1pY29ucyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItY29yZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXGNyZWF0ZS1vcmRlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWJkdWwvRG93bmxvYWRzL1Nvc2hrYS9Tb3Noa2EvZWNvbW1lcmNlLWFwcC9hcGkvY3JlYXRlLW9yZGVyLmpzXCI7aW1wb3J0IFJhem9ycGF5IGZyb20gJ3Jhem9ycGF5JztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZnVuY3Rpb24gbG9hZEVudkZhbGxiYWNrKCkge1xuICB0cnkge1xuICAgIGNvbnN0IGVudlBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy5lbnYnKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhlbnZQYXRoKSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCAndXRmOCcpO1xuICAgICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICh0cmltbWVkICYmICF0cmltbWVkLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICAgIGNvbnN0IGZpcnN0RXF1YWwgPSB0cmltbWVkLmluZGV4T2YoJz0nKTtcbiAgICAgICAgICBpZiAoZmlyc3RFcXVhbCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHRyaW1tZWQuc2xpY2UoMCwgZmlyc3RFcXVhbCkudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJpbW1lZC5zbGljZShmaXJzdEVxdWFsICsgMSkudHJpbSgpO1xuICAgICAgICAgICAgcHJvY2Vzcy5lbnZba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZmFsbGJhY2sgLmVudjonLCBlcnIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFJlcXVlc3RCb2R5KHJlcSkge1xuICBpZiAocmVxLmJvZHkpIHtcbiAgICByZXR1cm4gdHlwZW9mIHJlcS5ib2R5ID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UocmVxLmJvZHkpIDogcmVxLmJvZHk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgYm9keSA9ICcnO1xuICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTtcbiAgICB9KTtcbiAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kUmVzcG9uc2UocmVzLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oZGF0YSk7XG4gIH1cbiAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XG4gIC8vIEFsbG93IG9ubHkgUE9TVCByZXF1ZXN0c1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwNSwgeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XG4gIH1cblxuICBsb2FkRW52RmFsbGJhY2soKTtcblxuICBjb25zdCBrZXlJZCA9IHByb2Nlc3MuZW52LlJBWk9SUEFZX0tFWV9JRDtcbiAgY29uc3Qga2V5U2VjcmV0ID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcblxuICBpZiAoIWtleUlkIHx8ICFrZXlTZWNyZXQpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAxLCB7IGVycm9yOiAnUmF6b3JwYXkga2V5cyBub3QgY29uZmlndXJlZCcgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBnZXRSZXF1ZXN0Qm9keShyZXEpO1xuICAgIGNvbnN0IHsgYW1vdW50LCBjdXJyZW5jeSA9ICdJTlInLCByZWNlaXB0IH0gPSBib2R5O1xuXG4gICAgY29uc3QgYW1vdW50SW50ID0gcGFyc2VJbnQoYW1vdW50LCAxMCk7XG4gICAgaWYgKGlzTmFOKGFtb3VudEludCkgfHwgYW1vdW50SW50IDwgMTAwKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnQW1vdW50IG11c3QgYmUgYXQgbGVhc3QgMTAwIHBhaXNlJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByYXpvcnBheSA9IG5ldyBSYXpvcnBheSh7XG4gICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAga2V5X3NlY3JldDoga2V5U2VjcmV0LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGFtb3VudDogYW1vdW50SW50LFxuICAgICAgY3VycmVuY3ksXG4gICAgICByZWNlaXB0OiByZWNlaXB0IHx8IGByZWNlaXB0XyR7RGF0ZS5ub3coKX1gLFxuICAgIH07XG5cbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IHJhem9ycGF5Lm9yZGVycy5jcmVhdGUob3B0aW9ucyk7XG5cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgMjAwLCB7XG4gICAgICBvcmRlcl9pZDogb3JkZXIuaWQsXG4gICAgICBhbW91bnQ6IG9yZGVyLmFtb3VudCxcbiAgICAgIGN1cnJlbmN5OiBvcmRlci5jdXJyZW5jeSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyBSYXpvcnBheSBvcmRlcjonLCBlcnJvcik7XG4gICAgLy8gSGFuZGxlIGF1dGggZmFpbHVyZXMgc3BlY2lmaWNhbGx5IGlmIHBvc3NpYmxlLCBvciBnZW5lcmFsIDUwMCBlcnJvclxuICAgIGlmIChlcnJvci5zdGF0dXNDb2RlID09PSA0MDEpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDEsIHsgZXJyb3I6ICdSYXpvcnBheSBhdXRoZW50aWNhdGlvbiBmYWlsZWQnIH0pO1xuICAgIH1cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNTAwLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEb3dubG9hZHNcXFxcU29zaGthXFxcXFNvc2hrYVxcXFxlY29tbWVyY2UtYXBwXFxcXGFwaVxcXFx2ZXJpZnktcGF5bWVudC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWJkdWwvRG93bmxvYWRzL1Nvc2hrYS9Tb3Noa2EvZWNvbW1lcmNlLWFwcC9hcGkvdmVyaWZ5LXBheW1lbnQuanNcIjtpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlKHJlcywgc3RhdHVzQ29kZSwgZGF0YSkge1xuICBpZiAodHlwZW9mIHJlcy5zdGF0dXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyhzdGF0dXNDb2RlKS5qc29uKGRhdGEpO1xuICB9XG4gIHJlcy53cml0ZUhlYWQoc3RhdHVzQ29kZSwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xuICAvLyBBbGxvdyBvbmx5IFBPU1QgcmVxdWVzdHNcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDUsIHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xuICB9XG5cbiAgbG9hZEVudkZhbGxiYWNrKCk7XG5cbiAgY29uc3Qga2V5U2VjcmV0ID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcblxuICBpZiAoIWtleVNlY3JldCkge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6ICdSYXpvcnBheSBzZWNyZXQga2V5IG5vdCBjb25maWd1cmVkJyB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IGdldFJlcXVlc3RCb2R5KHJlcSk7XG4gICAgY29uc3QgeyBvcmRlcl9pZCwgcGF5bWVudF9pZCwgc2lnbmF0dXJlIH0gPSBib2R5O1xuXG4gICAgLy8gVmFsaWRhdGUgcHJlc2VuY2Ugb2YgcmVxdWlyZWQgZmllbGRzXG4gICAgaWYgKCFvcmRlcl9pZCB8fCAhcGF5bWVudF9pZCB8fCAhc2lnbmF0dXJlKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnTWlzc2luZyByZXF1aXJlZCBzaWduYXR1cmUgdmVyaWZpY2F0aW9uIGZpZWxkcycgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgZXhwZWN0ZWQgc2lnbmF0dXJlXG4gICAgY29uc3QgdGV4dCA9IG9yZGVyX2lkICsgJ3wnICsgcGF5bWVudF9pZDtcbiAgICBjb25zdCBnZW5lcmF0ZWRTaWduYXR1cmUgPSBjcnlwdG9cbiAgICAgIC5jcmVhdGVIbWFjKCdzaGEyNTYnLCBrZXlTZWNyZXQpXG4gICAgICAudXBkYXRlKHRleHQpXG4gICAgICAuZGlnZXN0KCdoZXgnKTtcblxuICAgIC8vIENvbXBhcmUgc2lnbmF0dXJlc1xuICAgIGlmIChnZW5lcmF0ZWRTaWduYXR1cmUgPT09IHNpZ25hdHVyZSkge1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwgeyBzdGF0dXM6ICdvaycsIHZlcmlmaWVkOiB0cnVlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Jhem9ycGF5IHNpZ25hdHVyZSBtaXNtYXRjaCcpO1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwgeyBzdGF0dXM6ICdmYWlsZWQnLCBlcnJvcjogJ1BheW1lbnQgc2lnbmF0dXJlIG1pc21hdGNoJyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgdmVyaWZ5aW5nIFJhem9ycGF5IHBheW1lbnQ6JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXGNvbnRhY3QuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rvd25sb2Fkcy9Tb3Noa2EvU29zaGthL2Vjb21tZXJjZS1hcHAvYXBpL2NvbnRhY3QuanNcIjtpbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gSGVscGVyIHRvIGxvYWQgZmFsbGJhY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzIGxvY2FsbHlcbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG4vLyBIZWxwZXIgdG8gcGFyc2UgcmVxdWVzdCBib2R5XG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuLy8gSGVscGVyIHRvIHNlbmQgSlNPTiByZXNwb25zZXNcbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShyZXMsIHN0YXR1c0NvZGUsIGRhdGEpIHtcbiAgaWYgKHR5cGVvZiByZXMuc3RhdHVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoc3RhdHVzQ29kZSkuanNvbihkYXRhKTtcbiAgfVxuICByZXMud3JpdGVIZWFkKHN0YXR1c0NvZGUsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcbiAgLy8gQWxsb3cgb25seSBQT1NUIHJlcXVlc3RzXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDA1LCB7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcbiAgfVxuXG4gIGxvYWRFbnZGYWxsYmFjaygpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IGdldFJlcXVlc3RCb2R5KHJlcSk7XG4gICAgY29uc3QgeyBuYW1lLCBlbWFpbCwgbWVzc2FnZSB9ID0gYm9keTtcblxuICAgIGlmICghbmFtZSB8fCAhZW1haWwgfHwgIW1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHsgZXJyb3I6ICdOYW1lLCBlbWFpbCwgYW5kIG1lc3NhZ2UgYXJlIHJlcXVpcmVkIGZpZWxkcycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LlNNVFBfSE9TVDtcbiAgICBjb25zdCBwb3J0ID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuU01UUF9QT1JUIHx8ICc1ODcnLCAxMCk7XG4gICAgY29uc3QgdXNlciA9IHByb2Nlc3MuZW52LlNNVFBfVVNFUjtcbiAgICBjb25zdCBwYXNzID0gcHJvY2Vzcy5lbnYuU01UUF9QQVNTO1xuICAgIGNvbnN0IHRvID0gcHJvY2Vzcy5lbnYuU01UUF9UTyB8fCAnc29zaGthLmluQGdtYWlsLmNvbSc7XG5cbiAgICAvLyBWZXJpZnkgU01UUCBzZXR0aW5ncyBhcmUgY29uZmlndXJlZCBhbmQgbm90IHBsYWNlaG9sZGVyc1xuICAgIGlmICghaG9zdCB8fCAhdXNlciB8fCAhcGFzcyB8fCBwYXNzID09PSAneW91ci1nbWFpbC1hcHAtcGFzc3dvcmQnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1NNVFAgY29uZmlndXJhdGlvbiBpcyBtaXNzaW5nIG9yIHVzaW5nIGRlZmF1bHQgcGxhY2Vob2xkZXJzLicpO1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwge1xuICAgICAgICBlcnJvcjogJ1NNVFAgY3JlZGVudGlhbHMgYXJlIG5vdCBmdWxseSBjb25maWd1cmVkIGluIHlvdXIgZW52aXJvbm1lbnQuIFBsZWFzZSB1cGRhdGUgU01UUF9QQVNTIGluIHRoZSAuZW52IGZpbGUuJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbm9kZW1haWxlciB0cmFuc3BvcnRlclxuICAgIGNvbnN0IHRyYW5zcG9ydGVyID0gbm9kZW1haWxlci5jcmVhdGVUcmFuc3BvcnQoe1xuICAgICAgaG9zdCxcbiAgICAgIHBvcnQsXG4gICAgICBzZWN1cmU6IHBvcnQgPT09IDQ2NSwgLy8gdHJ1ZSBmb3IgNDY1LCBmYWxzZSBmb3Igb3RoZXIgcG9ydHNcbiAgICAgIGF1dGg6IHtcbiAgICAgICAgdXNlcixcbiAgICAgICAgcGFzcyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYSBiZWF1dGlmdWwgSFRNTCBib2R5XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IHN0eWxlPVwiZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBtYXgtd2lkdGg6IDYwMHB4OyBtYXJnaW46IDAgYXV0bzsgcGFkZGluZzogMjBweDsgYm9yZGVyOiAxcHggc29saWQgI2UyZThmMDsgYm9yZGVyLXJhZGl1czogOHB4O1wiPlxuICAgICAgICA8aDIgc3R5bGU9XCJjb2xvcjogIzRmNDZlNTsgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmctYm90dG9tOiAxMHB4OyBtYXJnaW4tdG9wOiAwO1wiPk5ldyBDb250YWN0IEZvcm0gSW5xdWlyeTwvaDI+XG4gICAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxNnB4OyBsaW5lLWhlaWdodDogMS41OyBjb2xvcjogIzFlMjkzYjtcIj5cbiAgICAgICAgICBZb3UgaGF2ZSByZWNlaXZlZCBhIG5ldyBjb250YWN0IHN1Ym1pc3Npb24gZnJvbSB5b3VyIHN0b3JlIHdlYnNpdGUuXG4gICAgICAgIDwvcD5cbiAgICAgICAgPHRhYmxlIHN0eWxlPVwid2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IG1hcmdpbi10b3A6IDIwcHg7XCI+XG4gICAgICAgICAgPHRyPlxuICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogOHB4IDA7IGZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogIzQ3NTU2OTsgd2lkdGg6IDEyMHB4O1wiPk5hbWU6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTtcIj4ke25hbWV9PC90ZD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBmb250LXdlaWdodDogYm9sZDsgY29sb3I6ICM0NzU1Njk7XCI+RW1haWw6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTtcIj5cbiAgICAgICAgICAgICAgPGEgaHJlZj1cIm1haWx0bzoke2VtYWlsfVwiIHN0eWxlPVwiY29sb3I6ICM0ZjQ2ZTU7IHRleHQtZGVjb3JhdGlvbjogbm9uZTtcIj4ke2VtYWlsfTwvYT5cbiAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiA4cHggMDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNDc1NTY5OyB2ZXJ0aWNhbC1hbGlnbjogdG9wO1wiPk1lc3NhZ2U6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyBsaW5lLWhlaWdodDogMS41O1wiPiR7bWVzc2FnZX08L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGFibGU+XG4gICAgICAgIDxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOiAzMHB4OyBwYWRkaW5nLXRvcDogMTVweDsgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlMmU4ZjA7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM5NGEzYjg7IHRleHQtYWxpZ246IGNlbnRlcjtcIj5cbiAgICAgICAgICBTZW50IGF1dG9tYXRpY2FsbHkgZnJvbSBTb3Noa2EgU3RvcmUgQ29udGFjdCBmb3JtLlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBEZWZpbmUgbWFpbCBvcHRpb25zXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgICBmcm9tOiBgXCIke25hbWV9IChTb3Noa2EgU3RvcmUgQ29udGFjdClcIiA8JHt1c2VyfT5gLFxuICAgICAgcmVwbHlUbzogZW1haWwsXG4gICAgICB0byxcbiAgICAgIHN1YmplY3Q6IGBbU29zaGthIFN0b3JlXSBDb250YWN0IFJlcXVlc3QgZnJvbSAke25hbWV9YCxcbiAgICAgIHRleHQ6IGBOZXcgQ29udGFjdCBSZXF1ZXN0XFxuXFxuTmFtZTogJHtuYW1lfVxcbkVtYWlsOiAke2VtYWlsfVxcbk1lc3NhZ2U6ICR7bWVzc2FnZX1gLFxuICAgICAgaHRtbDogaHRtbENvbnRlbnQsXG4gICAgfTtcblxuICAgIC8vIFNlbmQgdGhlIGVtYWlsXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnRW1haWwgc2VudCBzdWNjZXNzZnVsbHknIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgZW1haWw6JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBzZW5kIGVtYWlsIG5vdGlmaWNhdGlvbicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXHNoaXByb2NrZXQtcGlja3VwLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hYmR1bC9Eb3dubG9hZHMvU29zaGthL1Nvc2hrYS9lY29tbWVyY2UtYXBwL2FwaS9zaGlwcm9ja2V0LXBpY2t1cC5qc1wiO2ltcG9ydCBwZyBmcm9tICdwZyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IHsgQ2xpZW50IH0gPSBwZztcblxuLy8gSGVscGVyIHRvIGxvYWQgZmFsbGJhY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzIGxvY2FsbHlcbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG4vLyBIZWxwZXIgdG8gcGFyc2UgcmVxdWVzdCBib2R5XG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuLy8gSGVscGVyIHRvIHNlbmQgSlNPTiByZXNwb25zZXNcbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShyZXMsIHN0YXR1c0NvZGUsIGRhdGEpIHtcbiAgaWYgKHR5cGVvZiByZXMuc3RhdHVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoc3RhdHVzQ29kZSkuanNvbihkYXRhKTtcbiAgfVxuICByZXMud3JpdGVIZWFkKHN0YXR1c0NvZGUsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcbiAgLy8gQWxsb3cgb25seSBQT1NUIHJlcXVlc3RzXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDA1LCB7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcbiAgfVxuXG4gIGxvYWRFbnZGYWxsYmFjaygpO1xuXG4gIGNvbnN0IGVtYWlsID0gcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9FTUFJTDtcbiAgY29uc3QgcGFzc3dvcmQgPSBwcm9jZXNzLmVudi5TSElQUk9DS0VUX1BBU1NXT1JEO1xuICBjb25zdCBwaWNrdXBMb2NhdGlvbiA9IHByb2Nlc3MuZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OIHx8ICdQcmltYXJ5JztcbiAgY29uc3QgY2hhbm5lbElkID0gcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9DSEFOTkVMX0lEO1xuXG4gIGlmICghZW1haWwgfHwgIXBhc3N3b3JkIHx8IGVtYWlsID09PSAneW91ci1zaGlwcm9ja2V0LWVtYWlsQGRvbWFpbi5jb20nKSB7XG4gICAgY29uc29sZS53YXJuKCdTaGlwcm9ja2V0IGNyZWRlbnRpYWxzIGFyZSBtaXNzaW5nIG9yIGRlZmF1bHQgcGxhY2Vob2xkZXJzLicpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHtcbiAgICAgIGVycm9yOiAnU2hpcHJvY2tldCBjcmVkZW50aWFscyBhcmUgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSB1cGRhdGUgU0hJUFJPQ0tFVF9FTUFJTCBhbmQgU0hJUFJPQ0tFVF9QQVNTV09SRCBpbiB5b3VyIC5lbnYgZmlsZS4nXG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBnZXRSZXF1ZXN0Qm9keShyZXEpO1xuICAgIGNvbnN0IHsgb3JkZXIsIGVtYWlsOiBjdXN0b21lckVtYWlsIH0gPSBib2R5O1xuXG4gICAgaWYgKCFvcmRlciB8fCAhb3JkZXIuaWQgfHwgIW9yZGVyLnNoaXBwaW5nX2FkZHJlc3MgfHwgIW9yZGVyLml0ZW1zKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnTWlzc2luZyBvcmRlciBkZXRhaWxzJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHNoaXBwaW5nX2FkZHJlc3MsIGl0ZW1zLCB0b3RhbCwgaWQ6IG9yZGVyVXVpZCB9ID0gb3JkZXI7XG5cbiAgICAvLyAxLiBBdXRoZW50aWNhdGUgd2l0aCBTaGlwcm9ja2V0XG4gICAgY29uc29sZS5sb2coJ0F1dGhlbnRpY2F0aW5nIHdpdGggU2hpcHJvY2tldC4uLicpO1xuICAgIGNvbnN0IGF1dGhSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGl2Mi5zaGlwcm9ja2V0LmluL3YxL2V4dGVybmFsL2F1dGgvbG9naW4nLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbCwgcGFzc3dvcmQgfSlcbiAgICB9KTtcblxuICAgIGlmICghYXV0aFJlcy5vaykge1xuICAgICAgY29uc3QgYXV0aEVycm9yID0gYXdhaXQgYXV0aFJlcy5qc29uKCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNoaXByb2NrZXQgYXV0aCBmYWlsZWQ6ICR7YXV0aEVycm9yLm1lc3NhZ2UgfHwgYXV0aFJlcy5zdGF0dXNUZXh0fWApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdG9rZW4gfSA9IGF3YWl0IGF1dGhSZXMuanNvbigpO1xuICAgIGNvbnNvbGUubG9nKCdTaGlwcm9ja2V0IGF1dGhlbnRpY2F0ZWQgc3VjY2Vzc2Z1bGx5LicpO1xuXG4gICAgLy8gMi4gRm9ybWF0IG9yZGVyIGRhdGVcbiAgICBjb25zdCBvcmRlckRhdGUgPSBuZXcgRGF0ZShvcmRlci5jcmVhdGVkX2F0IHx8IERhdGUubm93KCkpXG4gICAgICAudG9JU09TdHJpbmcoKVxuICAgICAgLnJlcGxhY2UoJ1QnLCAnICcpXG4gICAgICAuc2xpY2UoMCwgMTYpO1xuXG4gICAgLy8gU3BsaXQgbmFtZSBpbnRvIGZpcnN0IGFuZCBsYXN0XG4gICAgY29uc3QgbmFtZVBhcnRzID0gKHNoaXBwaW5nX2FkZHJlc3MubmFtZSB8fCAnQ3VzdG9tZXInKS50cmltKCkuc3BsaXQoL1xccysvKTtcbiAgICBjb25zdCBmaXJzdE5hbWUgPSBuYW1lUGFydHNbMF07XG4gICAgY29uc3QgbGFzdE5hbWUgPSBuYW1lUGFydHMuc2xpY2UoMSkuam9pbignICcpIHx8ICcuJztcblxuICAgIC8vIEZvcm1hdCBpdGVtc1xuICAgIGNvbnN0IG9yZGVySXRlbXMgPSBpdGVtcy5tYXAoKGl0ZW0sIGlkeCkgPT4gKHtcbiAgICAgIG5hbWU6IGl0ZW0ubmFtZSB8fCBgSmV3ZWxyeSBJdGVtICR7aWR4ICsgMX1gLFxuICAgICAgc2t1OiBpdGVtLnByb2R1Y3RfaWQgPyBpdGVtLnByb2R1Y3RfaWQuc2xpY2UoMCwgOCkgOiBgU0tVLSR7aWR4fWAsXG4gICAgICB1bml0czogcGFyc2VJbnQoaXRlbS5xdWFudGl0eSB8fCAnMScsIDEwKSxcbiAgICAgIHNlbGxpbmdfcHJpY2U6IHBhcnNlRmxvYXQoaXRlbS5wcmljZSB8fCAnMCcpXG4gICAgfSkpO1xuXG4gICAgLy8gQnVpbGQgdGhlIFNoaXByb2NrZXQgQWRob2MgT3JkZXIgcGF5bG9hZFxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICBvcmRlcl9pZDogb3JkZXJVdWlkLnNsaWNlKDAsIDIwKSwgLy8gTWF4IDIwIGNoYXJhY3RlcnMgZm9yIHR5cGljYWwgU2hpcHJvY2tldCBJRFxuICAgICAgb3JkZXJfZGF0ZTogb3JkZXJEYXRlLFxuICAgICAgcGlja3VwX2xvY2F0aW9uOiBwaWNrdXBMb2NhdGlvbixcbiAgICAgIGNoYW5uZWxfaWQ6IGNoYW5uZWxJZCA/IHBhcnNlSW50KGNoYW5uZWxJZCwgMTApIDogdW5kZWZpbmVkLFxuICAgICAgYmlsbGluZ19jdXN0b21lcl9uYW1lOiBmaXJzdE5hbWUsXG4gICAgICBiaWxsaW5nX2xhc3RfbmFtZTogbGFzdE5hbWUsXG4gICAgICBiaWxsaW5nX2FkZHJlc3M6IHNoaXBwaW5nX2FkZHJlc3MuYWRkcmVzc0xpbmUgfHwgc2hpcHBpbmdfYWRkcmVzcy5hZGRyZXNzIHx8ICdBZGRyZXNzIExpbmUgMScsXG4gICAgICBiaWxsaW5nX2NpdHk6IHNoaXBwaW5nX2FkZHJlc3MuY2l0eSB8fCAnQ2l0eScsXG4gICAgICBiaWxsaW5nX3BpbmNvZGU6IHBhcnNlSW50KHNoaXBwaW5nX2FkZHJlc3MucG9zdGFsQ29kZSB8fCAnMTEwMDAxJywgMTApLFxuICAgICAgYmlsbGluZ19zdGF0ZTogc2hpcHBpbmdfYWRkcmVzcy5zdGF0ZSB8fCAnU3RhdGUnLFxuICAgICAgYmlsbGluZ19jb3VudHJ5OiAnSW5kaWEnLFxuICAgICAgYmlsbGluZ19lbWFpbDogY3VzdG9tZXJFbWFpbCB8fCAnY3VzdG9tZXJAc29zaGthLmluJyxcbiAgICAgIGJpbGxpbmdfcGhvbmU6IHNoaXBwaW5nX2FkZHJlc3MucGhvbmUgPyBzaGlwcGluZ19hZGRyZXNzLnBob25lLnJlcGxhY2UoL1teMC05XS9nLCAnJykgOiAnOTg3NjU0MzIxMCcsXG4gICAgICBzaGlwcGluZ19pc19iaWxsaW5nOiB0cnVlLFxuICAgICAgb3JkZXJfaXRlbXM6IG9yZGVySXRlbXMsXG4gICAgICBwYXltZW50X21ldGhvZDogJ1ByZXBhaWQnLFxuICAgICAgc3ViX3RvdGFsOiBwYXJzZUZsb2F0KHRvdGFsIHx8ICcwJyksXG4gICAgICBsZW5ndGg6IDEwLCAvLyBjbSAoZGVmYXVsdCBwYWNrYWdlIGJveCBzaXplKVxuICAgICAgYnJlYWR0aDogMTAsICAvLyBjbVxuICAgICAgaGVpZ2h0OiA1LCAgLy8gY21cbiAgICAgIHdlaWdodDogMC4yIC8vIGtnXG4gICAgfTtcblxuICAgIC8vIDMuIENyZWF0ZSB0aGUgb3JkZXIgaW4gU2hpcHJvY2tldFxuICAgIGNvbnNvbGUubG9nKCdTZW5kaW5nIG9yZGVyIHBheWxvYWQgdG8gU2hpcHJvY2tldC4uLicpO1xuICAgIGNvbnN0IGNyZWF0ZU9yZGVyUmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9vcmRlcnMvY3JlYXRlL2FkaG9jJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxuICAgIH0pO1xuXG4gICAgaWYgKCFjcmVhdGVPcmRlclJlcy5vaykge1xuICAgICAgY29uc3QgY3JlYXRlRXJyb3JNc2cgPSBhd2FpdCBjcmVhdGVPcmRlclJlcy50ZXh0KCk7XG4gICAgICBjb25zb2xlLmVycm9yKCdTaGlwcm9ja2V0IG9yZGVyIGNyZWF0aW9uIGVycm9yIHJlc3BvbnNlOicsIGNyZWF0ZUVycm9yTXNnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBvcmRlciBjcmVhdGlvbiBmYWlsZWQ6ICR7Y3JlYXRlRXJyb3JNc2d9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRlRGF0YSA9IGF3YWl0IGNyZWF0ZU9yZGVyUmVzLmpzb24oKTtcbiAgICBjb25zb2xlLmxvZygnU2hpcHJvY2tldCBvcmRlciBjcmVhdGVkOicsIGNyZWF0ZURhdGEpO1xuXG4gICAgbGV0IHNoaXBtZW50SWQgPSBudWxsO1xuICAgIGxldCBhd2JDb2RlID0gJyc7XG5cbiAgICBpZiAoY3JlYXRlRGF0YS5zaGlwbWVudF9pZCkge1xuICAgICAgc2hpcG1lbnRJZCA9IGNyZWF0ZURhdGEuc2hpcG1lbnRfaWQ7XG4gICAgICBhd2JDb2RlID0gY3JlYXRlRGF0YS5hd2JfY29kZSB8fCAnJztcbiAgICB9IGVsc2UgaWYgKGNyZWF0ZURhdGEuZGF0YSAmJiBjcmVhdGVEYXRhLmRhdGEuc2hpcG1lbnRfaWQpIHtcbiAgICAgIHNoaXBtZW50SWQgPSBjcmVhdGVEYXRhLmRhdGEuc2hpcG1lbnRfaWQ7XG4gICAgICBhd2JDb2RlID0gY3JlYXRlRGF0YS5kYXRhLmF3Yl9jb2RlIHx8ICcnO1xuICAgIH0gZWxzZSBpZiAoY3JlYXRlRGF0YS5kYXRhICYmIGNyZWF0ZURhdGEuZGF0YS5kYXRhICYmIEFycmF5LmlzQXJyYXkoY3JlYXRlRGF0YS5kYXRhLmRhdGEpICYmIGNyZWF0ZURhdGEuZGF0YS5kYXRhWzBdKSB7XG4gICAgICBzaGlwbWVudElkID0gY3JlYXRlRGF0YS5kYXRhLmRhdGFbMF0uc2hpcG1lbnRfaWQ7XG4gICAgICBhd2JDb2RlID0gY3JlYXRlRGF0YS5kYXRhLmRhdGFbMF0uYXdiX2NvZGUgfHwgJyc7XG4gICAgfSBlbHNlIGlmIChjcmVhdGVEYXRhLmRhdGEgJiYgQXJyYXkuaXNBcnJheShjcmVhdGVEYXRhLmRhdGEpICYmIGNyZWF0ZURhdGEuZGF0YVswXSkge1xuICAgICAgc2hpcG1lbnRJZCA9IGNyZWF0ZURhdGEuZGF0YVswXS5zaGlwbWVudF9pZDtcbiAgICAgIGF3YkNvZGUgPSBjcmVhdGVEYXRhLmRhdGFbMF0uYXdiX2NvZGUgfHwgJyc7XG4gICAgfVxuXG4gICAgaWYgKCFzaGlwbWVudElkKSB7XG4gICAgICBpZiAoY3JlYXRlRGF0YS5tZXNzYWdlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBvcmRlciBjcmVhdGlvbiBmYWlsZWQ6ICR7Y3JlYXRlRGF0YS5tZXNzYWdlfWApO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTaGlwcm9ja2V0IGRpZCBub3QgcmV0dXJuIGEgc2hpcG1lbnQgSUQuIFJlc3BvbnNlOiAke0pTT04uc3RyaW5naWZ5KGNyZWF0ZURhdGEpfWApO1xuICAgIH1cblxuICAgIC8vIDQuIFNjaGVkdWxlIGNvdXJpZXIgcGlja3VwXG4gICAgY29uc29sZS5sb2coYFNjaGVkdWxpbmcgcGlja3VwIGZvciBzaGlwbWVudDogJHtzaGlwbWVudElkfS4uLmApO1xuICAgIGNvbnN0IHBpY2t1cFJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaXYyLnNoaXByb2NrZXQuaW4vdjEvZXh0ZXJuYWwvY291cmllci9nZW5lcmF0ZS9waWNrdXAnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dG9rZW59YFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc2hpcG1lbnRfaWQ6IFtzaGlwbWVudElkXVxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGlmICghcGlja3VwUmVzLm9rKSB7XG4gICAgICBjb25zdCBwaWNrdXBFcnJvciA9IGF3YWl0IHBpY2t1cFJlcy50ZXh0KCk7XG4gICAgICBjb25zb2xlLndhcm4oJ1NoaXByb2NrZXQgcGlja3VwIHNjaGVkdWxpbmcgd2FybmluZyAobWlnaHQgbmVlZCBtYW51YWxseSBhcHByb3ZlZC9yZS1zY2hlZHVsZWQpOicsIHBpY2t1cEVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcGlja3VwRGF0YSA9IGF3YWl0IHBpY2t1cFJlcy5qc29uKCk7XG4gICAgICBjb25zb2xlLmxvZygnU2hpcHJvY2tldCBwaWNrdXAgc2NoZWR1bGVkIHN1Y2Nlc3NmdWxseTonLCBwaWNrdXBEYXRhKTtcbiAgICB9XG5cbiAgICAvLyA1LiBTYXZlIHNoaXBtZW50IG1ldGFkYXRhIGluIFN1cGFiYXNlXG4gICAgY29uc29sZS5sb2coJ1NhdmluZyBzaGlwbWVudCBkZXRhaWxzIGluIGxvY2FsIGRhdGFiYXNlLi4uJyk7XG4gICAgY29uc3QgcGdDb25uZWN0aW9uU3RyaW5nID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMO1xuICAgIGlmICghcGdDb25uZWN0aW9uU3RyaW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RBVEFCQVNFX1VSTCBpcyBub3QgY29uZmlndXJlZCBpbiB0aGUgZW52aXJvbm1lbnQuJyk7XG4gICAgfVxuICAgIGNvbnN0IGRiQ2xpZW50ID0gbmV3IENsaWVudCh7XG4gICAgICBjb25uZWN0aW9uU3RyaW5nOiBwZ0Nvbm5lY3Rpb25TdHJpbmcsXG4gICAgICBzc2w6IHsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSB9XG4gICAgfSk7XG5cbiAgICBhd2FpdCBkYkNsaWVudC5jb25uZWN0KCk7XG4gICAgXG4gICAgYXdhaXQgZGJDbGllbnQucXVlcnkoYFxuICAgICAgVVBEQVRFIHB1YmxpYy5vcmRlcnNcbiAgICAgIFNFVCBzaGlwcm9ja2V0X3NoaXBtZW50X2lkID0gJDEsIHNoaXByb2NrZXRfYXdiID0gJDJcbiAgICAgIFdIRVJFIGlkID0gJDNcbiAgICBgLCBbU3RyaW5nKHNoaXBtZW50SWQpLCBTdHJpbmcoYXdiQ29kZSksIG9yZGVyVXVpZF0pO1xuXG4gICAgYXdhaXQgZGJDbGllbnQuZW5kKCk7XG4gICAgY29uc29sZS5sb2coJ09yZGVyIHNoaXBtZW50IG1ldGFkYXRhIHVwZGF0ZWQgaW4gZGF0YWJhc2Ugc3VjY2Vzc2Z1bGx5IScpO1xuXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHNoaXBtZW50X2lkOiBzaGlwbWVudElkLFxuICAgICAgYXdiX2NvZGU6IGF3YkNvZGVcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIFNoaXByb2NrZXQgaW50ZWdyYXRpb246JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ludGVybmFsIFNoaXByb2NrZXQgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEb3dubG9hZHNcXFxcU29zaGthXFxcXFNvc2hrYVxcXFxlY29tbWVyY2UtYXBwXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcXFxcc2VuZC1vcmRlci1jb25maXJtYXRpb24uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rvd25sb2Fkcy9Tb3Noa2EvU29zaGthL2Vjb21tZXJjZS1hcHAvYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uLmpzXCI7aW1wb3J0IG5vZGVtYWlsZXIgZnJvbSAnbm9kZW1haWxlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIEhlbHBlciB0byBsb2FkIGZhbGxiYWNrIGVudmlyb25tZW50IHZhcmlhYmxlcyBsb2NhbGx5XG5mdW5jdGlvbiBsb2FkRW52RmFsbGJhY2soKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZW52UGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnLmVudicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGVudlBhdGgpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGVudlBhdGgsICd1dGY4Jyk7XG4gICAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoJ1xcbicpO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgICAgICAgaWYgKHRyaW1tZWQgJiYgIXRyaW1tZWQuc3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICAgICAgY29uc3QgZmlyc3RFcXVhbCA9IHRyaW1tZWQuaW5kZXhPZignPScpO1xuICAgICAgICAgIGlmIChmaXJzdEVxdWFsICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gdHJpbW1lZC5zbGljZSgwLCBmaXJzdEVxdWFsKS50cmltKCk7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmltbWVkLnNsaWNlKGZpcnN0RXF1YWwgKyAxKS50cmltKCk7XG4gICAgICAgICAgICBwcm9jZXNzLmVudltrZXldID0gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBmYWxsYmFjayAuZW52OicsIGVycik7XG4gIH1cbn1cblxuLy8gSGVscGVyIHRvIHBhcnNlIHJlcXVlc3QgYm9keVxuYXN5bmMgZnVuY3Rpb24gZ2V0UmVxdWVzdEJvZHkocmVxKSB7XG4gIGlmIChyZXEuYm9keSkge1xuICAgIHJldHVybiB0eXBlb2YgcmVxLmJvZHkgPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShyZXEuYm9keSkgOiByZXEuYm9keTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBib2R5ID0gJyc7XG4gICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xuICAgICAgYm9keSArPSBjaHVuay50b1N0cmluZygpO1xuICAgIH0pO1xuICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZShib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXEub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKTtcbiAgfSk7XG59XG5cbi8vIEhlbHBlciB0byBzZW5kIEpTT04gcmVzcG9uc2VzXG5mdW5jdGlvbiBzZW5kUmVzcG9uc2UocmVzLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oZGF0YSk7XG4gIH1cbiAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufVxuXG4vLyBGb3JtYXQgY3VycmVuY3kgaW4gSW5kaWFuIFJ1cGVlc1xuZnVuY3Rpb24gZm9ybWF0SU5SKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLUlOJywge1xuICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgIGN1cnJlbmN5OiAnSU5SJyxcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDJcbiAgfSkuZm9ybWF0KHZhbHVlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xuICAvLyBBbGxvdyBvbmx5IFBPU1QgcmVxdWVzdHNcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDUsIHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xuICB9XG5cbiAgbG9hZEVudkZhbGxiYWNrKCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgZ2V0UmVxdWVzdEJvZHkocmVxKTtcbiAgICBjb25zdCB7IG9yZGVyLCBlbWFpbCB9ID0gYm9keTtcblxuICAgIGlmICghb3JkZXIpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHsgZXJyb3I6ICdPcmRlciBkZXRhaWxzIGFyZSByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgbGV0IGN1c3RvbWVyRW1haWwgPSBlbWFpbDtcbiAgICBpZiAoIWN1c3RvbWVyRW1haWwgJiYgb3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8uZW1haWwpIHtcbiAgICAgIGN1c3RvbWVyRW1haWwgPSBvcmRlci5zaGlwcGluZ19hZGRyZXNzLmVtYWlsO1xuICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGN1c3RvbWVyIGVtYWlsIGZyb20gb3JkZXIuc2hpcHBpbmdfYWRkcmVzczonLCBjdXN0b21lckVtYWlsKTtcbiAgICB9XG4gICAgaWYgKCFjdXN0b21lckVtYWlsICYmIG9yZGVyLnVzZXJfaWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFbWFpbCBub3QgcHJvdmlkZWQgaW4gYm9keS4gUXVlcnlpbmcgZGF0YWJhc2UgZm9yIHVzZXIgZW1haWwuLi4nKTtcbiAgICAgIGNvbnN0IHBnQ29ubmVjdGlvblN0cmluZyA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTDtcbiAgICAgIGlmIChwZ0Nvbm5lY3Rpb25TdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IENsaWVudCB9ID0gYXdhaXQgaW1wb3J0KCdwZycpO1xuICAgICAgICAgIGNvbnN0IGRiQ2xpZW50ID0gbmV3IENsaWVudCh7XG4gICAgICAgICAgICBjb25uZWN0aW9uU3RyaW5nOiBwZ0Nvbm5lY3Rpb25TdHJpbmcsXG4gICAgICAgICAgICBzc2w6IHsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYXdhaXQgZGJDbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFRyeSB0byBmZXRjaCBmcm9tIHByb2ZpbGVzIGZpcnN0XG4gICAgICAgICAgY29uc3QgcHJvZmlsZVJlcyA9IGF3YWl0IGRiQ2xpZW50LnF1ZXJ5KCdTRUxFQ1QgZW1haWwgRlJPTSBwdWJsaWMucHJvZmlsZXMgV0hFUkUgaWQgPSAkMScsIFtvcmRlci51c2VyX2lkXSk7XG4gICAgICAgICAgaWYgKHByb2ZpbGVSZXMucm93cyAmJiBwcm9maWxlUmVzLnJvd3NbMF0/LmVtYWlsKSB7XG4gICAgICAgICAgICBjdXN0b21lckVtYWlsID0gcHJvZmlsZVJlcy5yb3dzWzBdLmVtYWlsO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGN1c3RvbWVyIGVtYWlsIGZyb20gcHVibGljLnByb2ZpbGVzOicsIGN1c3RvbWVyRW1haWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gZmV0Y2ggZnJvbSBhdXRoLnVzZXJzIChyZXF1aXJlcyBEQiBhY2Nlc3MgcHJpdmlsZWdlcylcbiAgICAgICAgICAgIGNvbnN0IHVzZXJSZXMgPSBhd2FpdCBkYkNsaWVudC5xdWVyeSgnU0VMRUNUIGVtYWlsIEZST00gYXV0aC51c2VycyBXSEVSRSBpZCA9ICQxJywgW29yZGVyLnVzZXJfaWRdKTtcbiAgICAgICAgICAgIGlmICh1c2VyUmVzLnJvd3MgJiYgdXNlclJlcy5yb3dzWzBdPy5lbWFpbCkge1xuICAgICAgICAgICAgICBjdXN0b21lckVtYWlsID0gdXNlclJlcy5yb3dzWzBdLmVtYWlsO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY3VzdG9tZXIgZW1haWwgZnJvbSBhdXRoLnVzZXJzOicsIGN1c3RvbWVyRW1haWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBkYkNsaWVudC5lbmQoKTtcbiAgICAgICAgfSBjYXRjaCAoZGJFcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB1c2VyIGVtYWlsIGZyb20gREI6JywgZGJFcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFjdXN0b21lckVtYWlsKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnQ3VzdG9tZXIgZW1haWwgYWRkcmVzcyBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LlNNVFBfSE9TVDtcbiAgICBjb25zdCBwb3J0ID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuU01UUF9QT1JUIHx8ICc1ODcnLCAxMCk7XG4gICAgY29uc3QgdXNlciA9IHByb2Nlc3MuZW52LlNNVFBfVVNFUjtcbiAgICBjb25zdCBwYXNzID0gcHJvY2Vzcy5lbnYuU01UUF9QQVNTO1xuXG4gICAgLy8gVmVyaWZ5IFNNVFAgc2V0dGluZ3NcbiAgICBpZiAoIWhvc3QgfHwgIXVzZXIgfHwgIXBhc3MpIHtcbiAgICAgIGNvbnNvbGUud2FybignU01UUCBjb25maWd1cmF0aW9uIGlzIG1pc3NpbmcuJyk7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7XG4gICAgICAgIGVycm9yOiAnU01UUCBjcmVkZW50aWFscyBhcmUgbm90IGZ1bGx5IGNvbmZpZ3VyZWQgaW4geW91ciBlbnZpcm9ubWVudC4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZWNhbGN1bGF0ZSBjYWxjdWxhdGlvbnMgdG8gdmVyaWZ5IGludm9pY2Ugc3BsaXRzXG4gICAgY29uc3QgaXRlbXMgPSBvcmRlci5pdGVtcyB8fCBbXTtcbiAgICBjb25zdCBzdWJ0b3RhbCA9IGl0ZW1zLnJlZHVjZSgoYWNjLCBpdGVtKSA9PiBhY2MgKyAoaXRlbS5wcmljZSAqIGl0ZW0ucXVhbnRpdHkpLCAwKTtcbiAgICBcbiAgICAvLyBVc2UgaW1wb3J0ZWQgY29uc3RhbnRzIGVxdWl2YWxlbnQgbG9naWNcbiAgICBjb25zdCBTSElQUElOR19DSEFSR0VTID0gMTUwO1xuICAgIGNvbnN0IEZSRUVfU0hJUFBJTkdfVEhSRVNIT0xEID0gMjUwMDtcbiAgICBjb25zdCBUQVhfUkFURSA9IDAuMTg7XG5cbiAgICBjb25zdCBzaGlwcGluZ0Nvc3QgPSBzdWJ0b3RhbCA+IDAgJiYgc3VidG90YWwgPCBGUkVFX1NISVBQSU5HX1RIUkVTSE9MRCA/IFNISVBQSU5HX0NIQVJHRVMgOiAwO1xuICAgIGNvbnN0IHRheENvc3QgPSBzdWJ0b3RhbCAqIFRBWF9SQVRFO1xuXG4gICAgLy8gQ3JlYXRlIGEgbm9kZW1haWxlciB0cmFuc3BvcnRlclxuICAgIGNvbnN0IHRyYW5zcG9ydGVyID0gbm9kZW1haWxlci5jcmVhdGVUcmFuc3BvcnQoe1xuICAgICAgaG9zdCxcbiAgICAgIHBvcnQsXG4gICAgICBzZWN1cmU6IHBvcnQgPT09IDQ2NSxcbiAgICAgIGF1dGg6IHtcbiAgICAgICAgdXNlcixcbiAgICAgICAgcGFzcyxcbiAgICAgIH0sXG4gICAgICB0bHM6IHtcbiAgICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQnVpbGQgdGhlIHByZW1pdW0gdGhlbWVkIFNcdTAwRjVzaGthIE9yZGVyIEludm9pY2VcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcbiAgICAgIDwhRE9DVFlQRSBodG1sPlxuICAgICAgPGh0bWw+XG4gICAgICA8aGVhZD5cbiAgICAgICAgPG1ldGEgY2hhcnNldD1cInV0Zi04XCI+XG4gICAgICAgIDxzdHlsZT5cbiAgICAgICAgICBib2R5IHtcbiAgICAgICAgICAgIGZvbnQtZmFtaWx5OiAnSGVsdmV0aWNhIE5ldWUnLCBIZWx2ZXRpY2EsIEFyaWFsLCBzYW5zLXNlcmlmO1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZhZmFmYTtcbiAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDA7XG4gICAgICAgICAgICBjb2xvcjogIzI2MjYyNjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmVtYWlsLWNvbnRhaW5lciB7XG4gICAgICAgICAgICBtYXgtd2lkdGg6IDYwMHB4O1xuICAgICAgICAgICAgbWFyZ2luOiAzMHB4IGF1dG87XG4gICAgICAgICAgICBiYWNrZ3JvdW5kOiAjZmZmZmZmO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2VhZWFlYTtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDE2cHg7XG4gICAgICAgICAgICBvdmVyZmxvdzogaGlkZGVuO1xuICAgICAgICAgICAgYm94LXNoYWRvdzogMCA0cHggMTJweCByZ2JhKDAsMCwwLDAuMDMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuYnJhbmQtaGVhZGVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICM5ODE4M2Y7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjOTgxODNmIDAlLCAjNjQwZjI4IDEwMCUpO1xuICAgICAgICAgICAgcGFkZGluZzogMzBweDtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmJyYW5kLW5hbWUge1xuICAgICAgICAgICAgZm9udC1zaXplOiAyOHB4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDgwMDtcbiAgICAgICAgICAgIGNvbG9yOiAjZmZmZmZmO1xuICAgICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDRweDtcbiAgICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgICAgICBtYXJnaW46IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5icmFuZC1zdWJ0aXRsZSB7XG4gICAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgICAgY29sb3I6ICNmN2EwYjk7XG4gICAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMnB4O1xuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgIG1hcmdpbjogNXB4IDAgMCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuaW52b2ljZS1ib2R5IHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDM1cHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5ncmVldGluZyB7XG4gICAgICAgICAgICBmb250LXNpemU6IDE4cHg7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMDtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDhweDtcbiAgICAgICAgICAgIGNvbG9yOiAjMWExYTFhO1xuICAgICAgICAgIH1cbiAgICAgICAgICAub3JkZXItc3RhdHVzLWJhbm5lciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmRmMmY1O1xuICAgICAgICAgICAgYm9yZGVyLWxlZnQ6IDRweCBzb2xpZCAjZmYyYTg1O1xuICAgICAgICAgICAgcGFkZGluZzogMTVweDtcbiAgICAgICAgICAgIG1hcmdpbjogMjBweCAwO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogNHB4O1xuICAgICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICAgIGNvbG9yOiAjOTgxODNmO1xuICAgICAgICAgIH1cbiAgICAgICAgICAubWV0YS10YWJsZSB7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDI1cHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDEycHg7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2VhZWFlYTtcbiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAxNXB4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAubWV0YS1sYWJlbCB7XG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDFweDtcbiAgICAgICAgICAgIHdpZHRoOiAzMCU7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5tZXRhLXZhbHVlIHtcbiAgICAgICAgICAgIGNvbG9yOiAjMjYyNjI2O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLml0ZW1zLXRhYmxlIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcbiAgICAgICAgICAgIG1hcmdpbjogMjBweCAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuaXRlbXMtaGVhZGVyIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTBweDtcbiAgICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiAycHggc29saWQgI2VhZWFlYTtcbiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAxMHB4O1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogbGVmdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLml0ZW0tcm93IHRkIHtcbiAgICAgICAgICAgIHBhZGRpbmc6IDE1cHggMDtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZjVmNWY1O1xuICAgICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLml0ZW0tbmFtZSB7XG4gICAgICAgICAgICBjb2xvcjogIzFhMWExYTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5pdGVtLW1ldGEge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogNHB4O1xuICAgICAgICAgIH1cbiAgICAgICAgICAuY2FsY3VsYXRpb24tc2VjdGlvbiB7XG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDE1cHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5jYWxjdWxhdGlvbi1yb3cgdGQge1xuICAgICAgICAgICAgcGFkZGluZzogOHB4IDA7XG4gICAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuY2FsY3VsYXRpb24tbGFiZWwge1xuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICAgICAgICAgIHBhZGRpbmctcmlnaHQ6IDI1cHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5jYWxjdWxhdGlvbi12YWwge1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogcmlnaHQ7XG4gICAgICAgICAgICB3aWR0aDogMjUlO1xuICAgICAgICAgICAgY29sb3I6ICMyNjI2MjY7XG4gICAgICAgICAgfVxuICAgICAgICAgIC50b3RhbC1yb3cgdGQge1xuICAgICAgICAgICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkICNlYWVhZWE7XG4gICAgICAgICAgICBwYWRkaW5nLXRvcDogMTVweCAhaW1wb3J0YW50O1xuICAgICAgICAgICAgZm9udC1zaXplOiAxNnB4ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICBmb250LXdlaWdodDogODAwICFpbXBvcnRhbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIC50b3RhbC1yb3cgLmNhbGN1bGF0aW9uLWxhYmVsIHtcbiAgICAgICAgICAgIGNvbG9yOiAjMWExYTFhO1xuICAgICAgICAgIH1cbiAgICAgICAgICAudG90YWwtcm93IC5jYWxjdWxhdGlvbi12YWwge1xuICAgICAgICAgICAgY29sb3I6ICM5ODE4M2Y7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5hZGRyZXNzLWNhcmQge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZjZmNmYztcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNmMGYwZjA7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA4cHg7XG4gICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMzBweDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjY7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5hZGRyZXNzLXRpdGxlIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDFweDtcbiAgICAgICAgICAgIGNvbG9yOiAjOGM4YzhjO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMTBweDtcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5icmFuZC1mb290ZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y3ZjdmNztcbiAgICAgICAgICAgIGJvcmRlci10b3A6IDFweCBzb2xpZCAjZWFlYWVhO1xuICAgICAgICAgICAgcGFkZGluZzogMjVweDtcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICAgIGNvbG9yOiAjOGM4YzhjO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmJyYW5kLWZvb3RlciBhIHtcbiAgICAgICAgICAgIGNvbG9yOiAjOTgxODNmO1xuICAgICAgICAgICAgdGV4dC1kZWNvcmF0aW9uOiBub25lO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDY1MDtcbiAgICAgICAgICB9XG4gICAgICAgIDwvc3R5bGU+XG4gICAgICA8L2hlYWQ+XG4gICAgICA8Ym9keT5cbiAgICAgICAgPGRpdiBjbGFzcz1cImVtYWlsLWNvbnRhaW5lclwiPlxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJicmFuZC1oZWFkZXJcIj5cbiAgICAgICAgICAgIDxoMSBjbGFzcz1cImJyYW5kLW5hbWVcIj5TXHUwMEY1c2hrYTwvaDE+XG4gICAgICAgICAgICA8cCBjbGFzcz1cImJyYW5kLXN1YnRpdGxlXCI+RmluZSBKZXdlbGxlcnk8L3A+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgXG4gICAgICAgICAgPGRpdiBjbGFzcz1cImludm9pY2UtYm9keVwiPlxuICAgICAgICAgICAgPGgyIGNsYXNzPVwiZ3JlZXRpbmdcIj5UaGFuayBZb3UgZm9yIFlvdXIgT3JkZXIhPC9oMj5cbiAgICAgICAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzY2NjsgbWFyZ2luOiAwIDAgMjBweCAwOyBsaW5lLWhlaWdodDogMS41O1wiPlxuICAgICAgICAgICAgICBXZSBoYXZlIHJlY2VpdmVkIHlvdXIgcHVyY2hhc2UgcmVxdWVzdC4gT3VyIGFydGlzYW5zIGFyZSBwcmVwYXJpbmcgeW91ciBzZWxlY3RlZCBpdGVtcyB3aXRoIGNhcmUuIFlvdSBjYW4gZmluZCB5b3VyIG9yZGVyIHJlY2VpcHQgZGV0YWlscyBvdXRsaW5lZCBiZWxvdzpcbiAgICAgICAgICAgIDwvcD5cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgPGRpdiBjbGFzcz1cIm9yZGVyLXN0YXR1cy1iYW5uZXJcIj5cbiAgICAgICAgICAgICAgWW91ciBvcmRlciBjb25maXJtYXRpb24gc3RhdHVzIGlzIGN1cnJlbnRseTogPHN0cm9uZz5QUk9DRVNTSU5HPC9zdHJvbmc+XG4gICAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwibWV0YS10YWJsZVwiPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS1sYWJlbFwiPk9yZGVyIE51bWJlcjwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS12YWx1ZVwiPiR7b3JkZXIuaWR9PC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgPHRyPlxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm1ldGEtbGFiZWxcIj5EYXRlIFBsYWNlZDwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS12YWx1ZVwiPiR7bmV3IERhdGUob3JkZXIuY3JlYXRlZF9hdCB8fCBEYXRlLm5vdygpKS50b0xvY2FsZVN0cmluZygnZW4tSU4nLCB7IHRpbWVab25lOiAnQXNpYS9Lb2xrYXRhJyB9KX08L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS1sYWJlbFwiPlRyYW5zYWN0aW9uIElEPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLXZhbHVlXCIgc3R5bGU9XCJmb250LWZhbWlseTogbW9ub3NwYWNlO1wiPiR7b3JkZXIucGF5bWVudF9pZCB8fCAnQ2FzaCBvbiBEZWxpdmVyeSd9PC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cIml0ZW1zLXRhYmxlXCI+XG4gICAgICAgICAgICAgIDx0aGVhZD5cbiAgICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3M9XCJpdGVtcy1oZWFkZXJcIiBzdHlsZT1cIndpZHRoOiA2MCU7XCI+SmV3ZWxyeSBJdGVtPC90aD5cbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cIml0ZW1zLWhlYWRlclwiIHN0eWxlPVwid2lkdGg6IDE1JTsgdGV4dC1hbGlnbjogY2VudGVyO1wiPlF0eTwvdGg+XG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3M9XCJpdGVtcy1oZWFkZXJcIiBzdHlsZT1cIndpZHRoOiAyNSU7IHRleHQtYWxpZ246IHJpZ2h0O1wiPlRvdGFsIFByaWNlPC90aD5cbiAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8L3RoZWFkPlxuICAgICAgICAgICAgICA8dGJvZHk+XG4gICAgICAgICAgICAgICAgJHtpdGVtcy5tYXAoaXRlbSA9PiBgXG4gICAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJpdGVtLXJvd1wiPlxuICAgICAgICAgICAgICAgICAgICA8dGQ+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3M9XCJpdGVtLW5hbWVcIj4ke2l0ZW0ubmFtZX08L3NwYW4+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW0tbWV0YVwiPlxuICAgICAgICAgICAgICAgICAgICAgICAgVW5pdCBQcmljZTogJHtmb3JtYXRJTlIoaXRlbS5wcmljZSl9XG4gICAgICAgICAgICAgICAgICAgICAgICAke2l0ZW0uc2l6ZSA/IGAgfCBTaXplOiA8c3Ryb25nPiR7aXRlbS5zaXplfTwvc3Ryb25nPmAgOiAnJ31cbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwidGV4dC1hbGlnbjogY2VudGVyOyBjb2xvcjogIzY2NjtcIj4ke2l0ZW0ucXVhbnRpdHl9PC90ZD5cbiAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwidGV4dC1hbGlnbjogcmlnaHQ7IGNvbG9yOiAjMWExYTFhO1wiPiR7Zm9ybWF0SU5SKGl0ZW0ucHJpY2UgKiBpdGVtLnF1YW50aXR5KX08L3RkPlxuICAgICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgICBgKS5qb2luKCcnKX1cbiAgICAgICAgICAgICAgPC90Ym9keT5cbiAgICAgICAgICAgIDwvdGFibGU+XG5cbiAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cImNhbGN1bGF0aW9uLXNlY3Rpb25cIj5cbiAgICAgICAgICAgICAgPHRyIGNsYXNzPVwiY2FsY3VsYXRpb24tcm93XCI+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tbGFiZWxcIj5TdWJ0b3RhbDwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tdmFsXCI+JHtmb3JtYXRJTlIoc3VidG90YWwpfTwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgICR7c2hpcHBpbmdDb3N0ID4gMCA/IGBcbiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3dcIj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+U2hpcHBpbmcgQ2hhcmdlczwvdGQ+XG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxjdWxhdGlvbi12YWxcIj4ke2Zvcm1hdElOUihzaGlwcGluZ0Nvc3QpfTwvdGQ+XG4gICAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgYCA6IGBcbiAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3dcIj5cbiAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+U2hpcHBpbmcgQ2hhcmdlczwvdGQ+XG4gICAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxjdWxhdGlvbi12YWxcIiBzdHlsZT1cImNvbG9yOiAjMTBiOTgxOyBmb250LXdlaWdodDogNzAwO1wiPkZSRUU8L3RkPlxuICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgIGB9XG4gICAgICAgICAgICAgIDx0ciBjbGFzcz1cImNhbGN1bGF0aW9uLXJvd1wiPlxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+R1NUICgxOCUpPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxjdWxhdGlvbi12YWxcIj4ke2Zvcm1hdElOUih0YXhDb3N0KX08L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3cgdG90YWwtcm93XCI+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tbGFiZWxcIj5Ub3RhbCBBbW91bnQgUGFpZDwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tdmFsXCI+JHtmb3JtYXRJTlIob3JkZXIudG90YWwpfTwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8L3RhYmxlPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYWRkcmVzcy1jYXJkXCI+XG4gICAgICAgICAgICAgIDxoNCBjbGFzcz1cImFkZHJlc3MtdGl0bGVcIj5cdUQ4M0RcdURDQ0QgRGlzcGF0Y2ggQWRkcmVzczwvaDQ+XG4gICAgICAgICAgICAgIDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogIzFhMWExYTsgZm9udC1zaXplOiAxM3B4O1wiPiR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ubmFtZX08L3N0cm9uZz48YnIgLz5cbiAgICAgICAgICAgICAgJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5hZGRyZXNzTGluZSB8fCBvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5saW5lMX08YnIgLz5cbiAgICAgICAgICAgICAgJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5jaXR5fSwgJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5zdGF0ZX0gLSAke29yZGVyLnNoaXBwaW5nX2FkZHJlc3M/LnBvc3RhbENvZGUgfHwgb3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ucG9zdGFsX2NvZGV9PGJyIC8+XG4gICAgICAgICAgICAgIENvbnRhY3Q6ICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ucGhvbmV9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnJhbmQtZm9vdGVyXCI+XG4gICAgICAgICAgICA8cD5JZiB5b3UgaGF2ZSBhbnkgcXVlc3Rpb25zLCBwbGVhc2UgY29udGFjdCBvdXIgY3VzdG9tIHNlcnZpY2UgZGVzayBhdCA8YSBocmVmPVwibWFpbHRvOnN1cHBvcnRAc29zaGthLmluXCI+c3VwcG9ydEBzb3Noa2EuaW48L2E+PC9wPlxuICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW4tdG9wOiAxNXB4OyBmb250LXNpemU6IDEwcHg7IGNvbG9yOiAjYjViNWI1O1wiPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gU1x1MDBGNXNoa2EgU3RvcmUuIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYm9keT5cbiAgICAgIDwvaHRtbD5cbiAgICBgO1xuXG4gICAgLy8gRGVmaW5lIG1haWwgb3B0aW9uc1xuICAgIGNvbnN0IG1haWxPcHRpb25zID0ge1xuICAgICAgZnJvbTogYFwiU1x1MDBGNXNoa2EgSmV3ZWxsZXJ5XCIgPCR7dXNlcn0+YCxcbiAgICAgIHRvOiBjdXN0b21lckVtYWlsLFxuICAgICAgc3ViamVjdDogYE9yZGVyIENvbmZpcm1lZCAtIEludm9pY2UgIyR7b3JkZXIuaWQuc2xpY2UoMCwgOCkudG9VcHBlckNhc2UoKX1gLFxuICAgICAgdGV4dDogYFRoYW5rIHlvdSBmb3IgeW91ciBwdXJjaGFzZSBmcm9tIFNcdTAwRjVzaGthIFN0b3JlIVxcblxcbk9yZGVyIE51bWJlcjogJHtvcmRlci5pZH1cXG5Ub3RhbCBBbW91bnQgUGFpZDogJHtmb3JtYXRJTlIob3JkZXIudG90YWwpfVxcblxcblRoYW5rIHlvdSBmb3Igc2hvcHBpbmcgd2l0aCB1cyFgLFxuICAgICAgaHRtbDogaHRtbENvbnRlbnQsXG4gICAgfTtcblxuICAgIC8vIFNlbmQgdGhlIGVtYWlsXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuXG4gICAgLy8gU2ltdWxhdGUgV2hhdHNBcHAgYmFja2VuZCBub3RpZmljYXRpb24gbG9nZ2luZ1xuICAgIGNvbnNvbGUubG9nKGBbV2hhdHNBcHAgTm90aWZpY2F0aW9uIFF1ZXVlZF0gTWVzc2FnZTogXCJEZWFyICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ubmFtZX0sIHlvdXIgU1x1MDBGNXNoa2Egb3JkZXIgIyR7b3JkZXIuaWQuc2xpY2UoMCwgOCl9IG9mICR7Zm9ybWF0SU5SKG9yZGVyLnRvdGFsKX0gaXMgY29uZmlybWVkLlwiIHNlbnQgdG8gJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5waG9uZX1gKTtcblxuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCAyMDAsIHsgc3VjY2VzczogdHJ1ZSwgbWVzc2FnZTogJ0VtYWlsIGludm9pY2Ugc2VudCBzdWNjZXNzZnVsbHknIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgb3JkZXIgY29uZmlybWF0aW9uIGVtYWlsOicsIGVycm9yKTtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNTAwLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdGYWlsZWQgdG8gc2VuZCBlbWFpbCBjb25maXJtYXRpb24nIH0pO1xuICB9XG59XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRWLFNBQVMsY0FBYyxlQUFlO0FBQ2xZLE9BQU8sV0FBVzs7O0FDRDBWLE9BQU8sY0FBYztBQUNqWSxPQUFPLFFBQVE7QUFDZixPQUFPLFVBQVU7QUFFakIsU0FBUyxrQkFBa0I7QUFDekIsTUFBSTtBQUNGLFVBQU0sVUFBVSxLQUFLLEtBQUssUUFBUSxJ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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FB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M0Isc0JBQXNCO0FBQUEsTUFDeEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxPQUFPO0FBQUEsTUFDTCxXQUFXO0FBQUEsTUFDWCxRQUFRO0FBQUEsTUFDUix1QkFBdUI7QUFBQSxNQUN2QixlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsVUFDTixhQUFhLElBQUk7QUFDZixnQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLGtCQUFJLEdBQUcsU0FBUyxPQUFPLEdBQUc7QUFDeEIsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLE1BQU0sR0FBRztBQUN2Qix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsT0FBTyxHQUFHO0FBQ3hCLHVCQUFPO0FBQUEsY0FDVDtBQUNBLGtCQUFJLEdBQUcsU0FBUyxXQUFXLEtBQUssR0FBRyxTQUFTLFdBQVcsR0FBRztBQUN4RCx1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsY0FBYyxHQUFHO0FBQy9CLHVCQUFPO0FBQUEsY0FDVDtBQUNBLHFCQUFPO0FBQUEsWUFDVDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsiZnMiLCAicGF0aCIsICJsb2FkRW52RmFsbGJhY2siLCAicGF0aCIsICJmcyIsICJnZXRSZXF1ZXN0Qm9keSIsICJzZW5kUmVzcG9uc2UiLCAiaGFuZGxlciIsICJmcyIsICJwYXRoIiwgImxvYWRFbnZGYWxsYmFjayIsICJwYXRoIiwgImZzIiwgImdldFJlcXVlc3RCb2R5IiwgInNlbmRSZXNwb25zZSIsICJoYW5kbGVyIiwgImZzIiwgInBhdGgiLCAibG9hZEVudkZhbGxiYWNrIiwgInBhdGgiLCAiZnMiLCAiZ2V0UmVxdWVzdEJvZHkiLCAic2VuZFJlc3BvbnNlIiwgImhhbmRsZXIiLCAibm9kZW1haWxlciIsICJmcyIsICJwYXRoIiwgImxvYWRFbnZGYWxsYmFjayIsICJwYXRoIiwgImZzIiwgImdldFJlcXVlc3RCb2R5IiwgInNlbmRSZXNwb25zZSIsICJoYW5kbGVyIiwgIkNsaWVudCIsICJub2RlbWFpbGVyIiwgImhhbmRsZXIiXQp9Cg==
