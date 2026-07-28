// vite.config.js
import { defineConfig, loadEnv } from "file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/@vitejs/plugin-react/dist/index.js";

// api/create-order.js
import Razorpay from "file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/razorpay/dist/razorpay.js";
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
import nodemailer from "file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/nodemailer/lib/nodemailer.js";
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
import pg from "file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/pg/esm/index.mjs";
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
import nodemailer2 from "file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/nodemailer/lib/nodemailer.js";
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
          const { Client: Client2 } = await import("file:///C:/Users/abdul/Desktop/SOSHKA/Soshka/ecommerce-app/node_modules/pg/esm/index.mjs");
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
    const displayOrderId = order.id.startsWith("00000000-0000-0000-0000-") ? order.id.split("-").pop() : order.id.slice(0, 8).toUpperCase();
    const SHIPPING_CHARGES = 0;
    const FREE_SHIPPING_THRESHOLD = 0;
    const TAX_RATE = 0;
    const shippingCost = 0;
    const taxCost = 0;
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
                <td class="meta-value">${displayOrderId}</td>
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
              ${order.cod_fee && Number(order.cod_fee) > 0 ? `
              <tr class="calculation-row">
                <td class="calculation-label">Cash on Delivery (COD) Fee</td>
                <td class="calculation-val">${formatINR(order.cod_fee)}</td>
              </tr>
              ` : ""}
              <tr class="calculation-row total-row">
                <td class="calculation-label">${order.payment_method === "cod" ? "Total Amount to Pay" : "Total Amount Paid"}</td>
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
      from: `"Soshka Jewellery" <${user}>`,
      to: customerEmail,
      replyTo: "soshka.in@gmail.com",
      subject: `Order Confirmed - Invoice #${displayOrderId} | Soshka`,
      text: `Thank you for your purchase from Soshka Store!

Order Number: ${displayOrderId}
Total Amount: ${formatINR(order.total)}

Thank you for shopping with us!`,
      html: htmlContent,
      headers: {
        "X-Auto-Response-Suppress": "All",
        "Precedence": "bulk"
      }
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAiYXBpL2NyZWF0ZS1vcmRlci5qcyIsICJhcGkvdmVyaWZ5LXBheW1lbnQuanMiLCAiYXBpL2NvbnRhY3QuanMiLCAiYXBpL3NoaXByb2NrZXQtcGlja3VwLmpzIiwgImFwaS9zZW5kLW9yZGVyLWNvbmZpcm1hdGlvbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERlc2t0b3BcXFxcU09TSEtBXFxcXFNvc2hrYVxcXFxlY29tbWVyY2UtYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEZXNrdG9wXFxcXFNPU0hLQVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFx2aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWJkdWwvRGVza3RvcC9TT1NIS0EvU29zaGthL2Vjb21tZXJjZS1hcHAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCBjcmVhdGVPcmRlckhhbmRsZXIgZnJvbSAnLi9hcGkvY3JlYXRlLW9yZGVyLmpzJ1xyXG5pbXBvcnQgdmVyaWZ5UGF5bWVudEhhbmRsZXIgZnJvbSAnLi9hcGkvdmVyaWZ5LXBheW1lbnQuanMnXHJcbmltcG9ydCBjb250YWN0SGFuZGxlciBmcm9tICcuL2FwaS9jb250YWN0LmpzJ1xyXG5pbXBvcnQgc2hpcHJvY2tldFBpY2t1cEhhbmRsZXIgZnJvbSAnLi9hcGkvc2hpcHJvY2tldC1waWNrdXAuanMnXHJcbmltcG9ydCBzZW5kT3JkZXJDb25maXJtYXRpb25IYW5kbGVyIGZyb20gJy4vYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uLmpzJ1xyXG5cclxuLy8gVHJpZ2dlciBkZXYgc2VydmVyIG1pZGRsZXdhcmUgcmVsb2FkIHRvIHJlZnJlc2ggRVMgbW9kdWxlcyAoZW1haWwgZmFsbGJhY2sgcHJpb3JpdGl6YXRpb24gdXBkYXRlKVxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XHJcbiAgLy8gTG9hZCBlbnYgdmFyaWFibGVzXHJcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XHJcblxyXG4gIC8vIFBvcHVsYXRlIHByb2Nlc3MuZW52IHNvIGJhY2tlbmQgZnVuY3Rpb25zIGNhbiBhY2Nlc3MgY3JlZGVudGlhbHNcclxuICBwcm9jZXNzLmVudi5SQVpPUlBBWV9LRVlfSUQgPSBlbnYuUkFaT1JQQVlfS0VZX0lEO1xyXG4gIHByb2Nlc3MuZW52LlJBWk9SUEFZX0tFWV9TRUNSRVQgPSBlbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcclxuICBwcm9jZXNzLmVudi5TTVRQX0hPU1QgPSBlbnYuU01UUF9IT1NUO1xyXG4gIHByb2Nlc3MuZW52LlNNVFBfUE9SVCA9IGVudi5TTVRQX1BPUlQ7XHJcbiAgcHJvY2Vzcy5lbnYuU01UUF9VU0VSID0gZW52LlNNVFBfVVNFUjtcclxuICBwcm9jZXNzLmVudi5TTVRQX1BBU1MgPSBlbnYuU01UUF9QQVNTO1xyXG4gIHByb2Nlc3MuZW52LlNNVFBfVE8gPSBlbnYuU01UUF9UTztcclxuICBwcm9jZXNzLmVudi5TSElQUk9DS0VUX0VNQUlMID0gZW52LlNISVBST0NLRVRfRU1BSUw7XHJcbiAgcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9QQVNTV09SRCA9IGVudi5TSElQUk9DS0VUX1BBU1NXT1JEO1xyXG4gIHByb2Nlc3MuZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OID0gZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OO1xyXG4gIHByb2Nlc3MuZW52LlNISVBST0NLRVRfQ0hBTk5FTF9JRCA9IGVudi5TSElQUk9DS0VUX0NIQU5ORUxfSUQ7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbXHJcbiAgICAgIHJlYWN0KCksXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiAnY3VzdG9tLWFwaS1taWRkbGV3YXJlJyxcclxuICAgICAgICBjb25maWd1cmVTZXJ2ZXIoc2VydmVyKSB7XHJcbiAgICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgW0RldiBTZXJ2ZXIgTWlkZGxld2FyZV0gSW5jb21pbmcgcmVxdWVzdDogJHtyZXEubWV0aG9kfSAke3JlcS51cmx9YCk7XHJcbiAgICAgICAgICAgIGlmIChyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvY3JlYXRlLW9yZGVyJykpIHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgY3JlYXRlT3JkZXJIYW5kbGVyKHJlcSwgcmVzKTtcclxuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvdmVyaWZ5LXBheW1lbnQnKSkge1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCB2ZXJpZnlQYXltZW50SGFuZGxlcihyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVxLnVybC5zdGFydHNXaXRoKCcvYXBpL2NvbnRhY3QnKSkge1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBhd2FpdCBjb250YWN0SGFuZGxlcihyZXEsIHJlcyk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAocmVxLnVybC5zdGFydHNXaXRoKCcvYXBpL3NoaXByb2NrZXQtcGlja3VwJykpIHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgYXdhaXQgc2hpcHJvY2tldFBpY2t1cEhhbmRsZXIocmVxLCByZXMpO1xyXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL2FwaS9zZW5kLW9yZGVyLWNvbmZpcm1hdGlvbicpKSB7XHJcbiAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgIGF3YWl0IHNlbmRPcmRlckNvbmZpcm1hdGlvbkhhbmRsZXIocmVxLCByZXMpO1xyXG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcclxuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgbmV4dCgpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICBdLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgIHBvcnQ6IDMwMDAsXHJcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXHJcbiAgICAgIG9wZW46IHRydWUsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnWC1GcmFtZS1PcHRpb25zJzogJ0RFTlknLFxyXG4gICAgICAgICdYLUNvbnRlbnQtVHlwZS1PcHRpb25zJzogJ25vc25pZmYnLFxyXG4gICAgICAgICdSZWZlcnJlci1Qb2xpY3knOiAnc3RyaWN0LW9yaWdpbi13aGVuLWNyb3NzLW9yaWdpbicsXHJcbiAgICAgICAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXHJcbiAgICAgICAgJ0NvbnRlbnQtU2VjdXJpdHktUG9saWN5JzogXCJkZWZhdWx0LXNyYyAnc2VsZic7IHNjcmlwdC1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyAndW5zYWZlLWV2YWwnIGh0dHBzOi8vY2hlY2tvdXQucmF6b3JwYXkuY29tOyBzdHlsZS1zcmMgJ3NlbGYnICd1bnNhZmUtaW5saW5lJyBodHRwczovL2ZvbnRzLmdvb2dsZWFwaXMuY29tOyBpbWctc3JjICdzZWxmJyBkYXRhOiBodHRwczo7IGZvbnQtc3JjICdzZWxmJyBkYXRhOiBodHRwczovL2ZvbnRzLmdzdGF0aWMuY29tOyBjb25uZWN0LXNyYyAnc2VsZicgaHR0cHM6Ly9ibWJlZ2p4ZmtweWVubmRmYmNkai5zdXBhYmFzZS5jbyB3c3M6Ly9ibWJlZ2p4ZmtweWVubmRmYmNkai5zdXBhYmFzZS5jbyBodHRwczovL2FwaS5yYXpvcnBheS5jb207IGZyYW1lLXNyYyAnc2VsZicgaHR0cHM6Ly9hcGkucmF6b3JwYXkuY29tIGh0dHBzOi8vY2hlY2tvdXQucmF6b3JwYXkuY29tO1wiLFxyXG4gICAgICAgICdQZXJtaXNzaW9ucy1Qb2xpY3knOiAnY2FtZXJhPSgpLCBtaWNyb3Bob25lPSgpLCBnZW9sb2NhdGlvbj0oKSwgaW50ZXJlc3QtY29ob3J0PSgpJ1xyXG4gICAgICB9XHJcbiAgICB9LFxyXG4gICAgYnVpbGQ6IHtcclxuICAgICAgc291cmNlbWFwOiBmYWxzZSxcclxuICAgICAgbWluaWZ5OiAnZXNidWlsZCcsXHJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAwMCxcclxuICAgICAgcm9sbHVwT3B0aW9uczoge1xyXG4gICAgICAgIG91dHB1dDoge1xyXG4gICAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XHJcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcclxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ3RocmVlJykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXRocmVlJztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdnc2FwJykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLWdzYXAnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ2xlbmlzJykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLWxlbmlzJztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdAc3VwYWJhc2UnKSB8fCBpZC5pbmNsdWRlcygnd2Vic29ja2V0JykpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAndmVuZG9yLXN1cGFiYXNlJztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsdWNpZGUtcmVhY3QnKSkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItaWNvbnMnO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1jb3JlJztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH07XHJcbn0pXHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRGVza3RvcFxcXFxTT1NIS0FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEZXNrdG9wXFxcXFNPU0hLQVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcXFxcY3JlYXRlLW9yZGVyLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hYmR1bC9EZXNrdG9wL1NPU0hLQS9Tb3Noa2EvZWNvbW1lcmNlLWFwcC9hcGkvY3JlYXRlLW9yZGVyLmpzXCI7aW1wb3J0IFJhem9ycGF5IGZyb20gJ3Jhem9ycGF5JztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZnVuY3Rpb24gbG9hZEVudkZhbGxiYWNrKCkge1xuICB0cnkge1xuICAgIGNvbnN0IGVudlBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy5lbnYnKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhlbnZQYXRoKSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCAndXRmOCcpO1xuICAgICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICh0cmltbWVkICYmICF0cmltbWVkLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICAgIGNvbnN0IGZpcnN0RXF1YWwgPSB0cmltbWVkLmluZGV4T2YoJz0nKTtcbiAgICAgICAgICBpZiAoZmlyc3RFcXVhbCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHRyaW1tZWQuc2xpY2UoMCwgZmlyc3RFcXVhbCkudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJpbW1lZC5zbGljZShmaXJzdEVxdWFsICsgMSkudHJpbSgpO1xuICAgICAgICAgICAgcHJvY2Vzcy5lbnZba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZmFsbGJhY2sgLmVudjonLCBlcnIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFJlcXVlc3RCb2R5KHJlcSkge1xuICBpZiAocmVxLmJvZHkpIHtcbiAgICByZXR1cm4gdHlwZW9mIHJlcS5ib2R5ID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UocmVxLmJvZHkpIDogcmVxLmJvZHk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgYm9keSA9ICcnO1xuICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTtcbiAgICB9KTtcbiAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kUmVzcG9uc2UocmVzLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oZGF0YSk7XG4gIH1cbiAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XG4gIC8vIEFsbG93IG9ubHkgUE9TVCByZXF1ZXN0c1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwNSwgeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XG4gIH1cblxuICBsb2FkRW52RmFsbGJhY2soKTtcblxuICBjb25zdCBrZXlJZCA9IHByb2Nlc3MuZW52LlJBWk9SUEFZX0tFWV9JRDtcbiAgY29uc3Qga2V5U2VjcmV0ID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcblxuICBpZiAoIWtleUlkIHx8ICFrZXlTZWNyZXQpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAxLCB7IGVycm9yOiAnUmF6b3JwYXkga2V5cyBub3QgY29uZmlndXJlZCcgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBnZXRSZXF1ZXN0Qm9keShyZXEpO1xuICAgIGNvbnN0IHsgYW1vdW50LCBjdXJyZW5jeSA9ICdJTlInLCByZWNlaXB0IH0gPSBib2R5O1xuXG4gICAgY29uc3QgYW1vdW50SW50ID0gcGFyc2VJbnQoYW1vdW50LCAxMCk7XG4gICAgaWYgKGlzTmFOKGFtb3VudEludCkgfHwgYW1vdW50SW50IDwgMTAwKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnQW1vdW50IG11c3QgYmUgYXQgbGVhc3QgMTAwIHBhaXNlJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByYXpvcnBheSA9IG5ldyBSYXpvcnBheSh7XG4gICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAga2V5X3NlY3JldDoga2V5U2VjcmV0LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGFtb3VudDogYW1vdW50SW50LFxuICAgICAgY3VycmVuY3ksXG4gICAgICByZWNlaXB0OiByZWNlaXB0IHx8IGByZWNlaXB0XyR7RGF0ZS5ub3coKX1gLFxuICAgIH07XG5cbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IHJhem9ycGF5Lm9yZGVycy5jcmVhdGUob3B0aW9ucyk7XG5cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgMjAwLCB7XG4gICAgICBvcmRlcl9pZDogb3JkZXIuaWQsXG4gICAgICBhbW91bnQ6IG9yZGVyLmFtb3VudCxcbiAgICAgIGN1cnJlbmN5OiBvcmRlci5jdXJyZW5jeSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyBSYXpvcnBheSBvcmRlcjonLCBlcnJvcik7XG4gICAgLy8gSGFuZGxlIGF1dGggZmFpbHVyZXMgc3BlY2lmaWNhbGx5IGlmIHBvc3NpYmxlLCBvciBnZW5lcmFsIDUwMCBlcnJvclxuICAgIGlmIChlcnJvci5zdGF0dXNDb2RlID09PSA0MDEpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDEsIHsgZXJyb3I6ICdSYXpvcnBheSBhdXRoZW50aWNhdGlvbiBmYWlsZWQnIH0pO1xuICAgIH1cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNTAwLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERlc2t0b3BcXFxcU09TSEtBXFxcXFNvc2hrYVxcXFxlY29tbWVyY2UtYXBwXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRGVza3RvcFxcXFxTT1NIS0FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXHZlcmlmeS1wYXltZW50LmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hYmR1bC9EZXNrdG9wL1NPU0hLQS9Tb3Noa2EvZWNvbW1lcmNlLWFwcC9hcGkvdmVyaWZ5LXBheW1lbnQuanNcIjtpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlKHJlcywgc3RhdHVzQ29kZSwgZGF0YSkge1xuICBpZiAodHlwZW9mIHJlcy5zdGF0dXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyhzdGF0dXNDb2RlKS5qc29uKGRhdGEpO1xuICB9XG4gIHJlcy53cml0ZUhlYWQoc3RhdHVzQ29kZSwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xuICAvLyBBbGxvdyBvbmx5IFBPU1QgcmVxdWVzdHNcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDUsIHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xuICB9XG5cbiAgbG9hZEVudkZhbGxiYWNrKCk7XG5cbiAgY29uc3Qga2V5U2VjcmV0ID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcblxuICBpZiAoIWtleVNlY3JldCkge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6ICdSYXpvcnBheSBzZWNyZXQga2V5IG5vdCBjb25maWd1cmVkJyB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IGdldFJlcXVlc3RCb2R5KHJlcSk7XG4gICAgY29uc3QgeyBvcmRlcl9pZCwgcGF5bWVudF9pZCwgc2lnbmF0dXJlIH0gPSBib2R5O1xuXG4gICAgLy8gVmFsaWRhdGUgcHJlc2VuY2Ugb2YgcmVxdWlyZWQgZmllbGRzXG4gICAgaWYgKCFvcmRlcl9pZCB8fCAhcGF5bWVudF9pZCB8fCAhc2lnbmF0dXJlKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnTWlzc2luZyByZXF1aXJlZCBzaWduYXR1cmUgdmVyaWZpY2F0aW9uIGZpZWxkcycgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgZXhwZWN0ZWQgc2lnbmF0dXJlXG4gICAgY29uc3QgdGV4dCA9IG9yZGVyX2lkICsgJ3wnICsgcGF5bWVudF9pZDtcbiAgICBjb25zdCBnZW5lcmF0ZWRTaWduYXR1cmUgPSBjcnlwdG9cbiAgICAgIC5jcmVhdGVIbWFjKCdzaGEyNTYnLCBrZXlTZWNyZXQpXG4gICAgICAudXBkYXRlKHRleHQpXG4gICAgICAuZGlnZXN0KCdoZXgnKTtcblxuICAgIC8vIENvbXBhcmUgc2lnbmF0dXJlc1xuICAgIGlmIChnZW5lcmF0ZWRTaWduYXR1cmUgPT09IHNpZ25hdHVyZSkge1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwgeyBzdGF0dXM6ICdvaycsIHZlcmlmaWVkOiB0cnVlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Jhem9ycGF5IHNpZ25hdHVyZSBtaXNtYXRjaCcpO1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwgeyBzdGF0dXM6ICdmYWlsZWQnLCBlcnJvcjogJ1BheW1lbnQgc2lnbmF0dXJlIG1pc21hdGNoJyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgdmVyaWZ5aW5nIFJhem9ycGF5IHBheW1lbnQ6JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRGVza3RvcFxcXFxTT1NIS0FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEZXNrdG9wXFxcXFNPU0hLQVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcXFxcY29udGFjdC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWJkdWwvRGVza3RvcC9TT1NIS0EvU29zaGthL2Vjb21tZXJjZS1hcHAvYXBpL2NvbnRhY3QuanNcIjtpbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gSGVscGVyIHRvIGxvYWQgZmFsbGJhY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzIGxvY2FsbHlcbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG4vLyBIZWxwZXIgdG8gcGFyc2UgcmVxdWVzdCBib2R5XG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuLy8gSGVscGVyIHRvIHNlbmQgSlNPTiByZXNwb25zZXNcbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShyZXMsIHN0YXR1c0NvZGUsIGRhdGEpIHtcbiAgaWYgKHR5cGVvZiByZXMuc3RhdHVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoc3RhdHVzQ29kZSkuanNvbihkYXRhKTtcbiAgfVxuICByZXMud3JpdGVIZWFkKHN0YXR1c0NvZGUsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcbiAgLy8gQWxsb3cgb25seSBQT1NUIHJlcXVlc3RzXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDA1LCB7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcbiAgfVxuXG4gIGxvYWRFbnZGYWxsYmFjaygpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IGdldFJlcXVlc3RCb2R5KHJlcSk7XG4gICAgY29uc3QgeyBuYW1lLCBlbWFpbCwgbWVzc2FnZSB9ID0gYm9keTtcblxuICAgIGlmICghbmFtZSB8fCAhZW1haWwgfHwgIW1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHsgZXJyb3I6ICdOYW1lLCBlbWFpbCwgYW5kIG1lc3NhZ2UgYXJlIHJlcXVpcmVkIGZpZWxkcycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LlNNVFBfSE9TVDtcbiAgICBjb25zdCBwb3J0ID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuU01UUF9QT1JUIHx8ICc1ODcnLCAxMCk7XG4gICAgY29uc3QgdXNlciA9IHByb2Nlc3MuZW52LlNNVFBfVVNFUjtcbiAgICBjb25zdCBwYXNzID0gcHJvY2Vzcy5lbnYuU01UUF9QQVNTO1xuICAgIGNvbnN0IHRvID0gcHJvY2Vzcy5lbnYuU01UUF9UTyB8fCAnc29zaGthLmluQGdtYWlsLmNvbSc7XG5cbiAgICAvLyBWZXJpZnkgU01UUCBzZXR0aW5ncyBhcmUgY29uZmlndXJlZCBhbmQgbm90IHBsYWNlaG9sZGVyc1xuICAgIGlmICghaG9zdCB8fCAhdXNlciB8fCAhcGFzcyB8fCBwYXNzID09PSAneW91ci1nbWFpbC1hcHAtcGFzc3dvcmQnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1NNVFAgY29uZmlndXJhdGlvbiBpcyBtaXNzaW5nIG9yIHVzaW5nIGRlZmF1bHQgcGxhY2Vob2xkZXJzLicpO1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwge1xuICAgICAgICBlcnJvcjogJ1NNVFAgY3JlZGVudGlhbHMgYXJlIG5vdCBmdWxseSBjb25maWd1cmVkIGluIHlvdXIgZW52aXJvbm1lbnQuIFBsZWFzZSB1cGRhdGUgU01UUF9QQVNTIGluIHRoZSAuZW52IGZpbGUuJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbm9kZW1haWxlciB0cmFuc3BvcnRlclxuICAgIGNvbnN0IHRyYW5zcG9ydGVyID0gbm9kZW1haWxlci5jcmVhdGVUcmFuc3BvcnQoe1xuICAgICAgaG9zdCxcbiAgICAgIHBvcnQsXG4gICAgICBzZWN1cmU6IHBvcnQgPT09IDQ2NSwgLy8gdHJ1ZSBmb3IgNDY1LCBmYWxzZSBmb3Igb3RoZXIgcG9ydHNcbiAgICAgIGF1dGg6IHtcbiAgICAgICAgdXNlcixcbiAgICAgICAgcGFzcyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYSBiZWF1dGlmdWwgSFRNTCBib2R5XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IHN0eWxlPVwiZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBtYXgtd2lkdGg6IDYwMHB4OyBtYXJnaW46IDAgYXV0bzsgcGFkZGluZzogMjBweDsgYm9yZGVyOiAxcHggc29saWQgI2UyZThmMDsgYm9yZGVyLXJhZGl1czogOHB4O1wiPlxuICAgICAgICA8aDIgc3R5bGU9XCJjb2xvcjogIzRmNDZlNTsgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmctYm90dG9tOiAxMHB4OyBtYXJnaW4tdG9wOiAwO1wiPk5ldyBDb250YWN0IEZvcm0gSW5xdWlyeTwvaDI+XG4gICAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxNnB4OyBsaW5lLWhlaWdodDogMS41OyBjb2xvcjogIzFlMjkzYjtcIj5cbiAgICAgICAgICBZb3UgaGF2ZSByZWNlaXZlZCBhIG5ldyBjb250YWN0IHN1Ym1pc3Npb24gZnJvbSB5b3VyIHN0b3JlIHdlYnNpdGUuXG4gICAgICAgIDwvcD5cbiAgICAgICAgPHRhYmxlIHN0eWxlPVwid2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IG1hcmdpbi10b3A6IDIwcHg7XCI+XG4gICAgICAgICAgPHRyPlxuICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogOHB4IDA7IGZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogIzQ3NTU2OTsgd2lkdGg6IDEyMHB4O1wiPk5hbWU6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTtcIj4ke25hbWV9PC90ZD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBmb250LXdlaWdodDogYm9sZDsgY29sb3I6ICM0NzU1Njk7XCI+RW1haWw6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTtcIj5cbiAgICAgICAgICAgICAgPGEgaHJlZj1cIm1haWx0bzoke2VtYWlsfVwiIHN0eWxlPVwiY29sb3I6ICM0ZjQ2ZTU7IHRleHQtZGVjb3JhdGlvbjogbm9uZTtcIj4ke2VtYWlsfTwvYT5cbiAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiA4cHggMDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNDc1NTY5OyB2ZXJ0aWNhbC1hbGlnbjogdG9wO1wiPk1lc3NhZ2U6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyBsaW5lLWhlaWdodDogMS41O1wiPiR7bWVzc2FnZX08L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGFibGU+XG4gICAgICAgIDxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOiAzMHB4OyBwYWRkaW5nLXRvcDogMTVweDsgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlMmU4ZjA7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM5NGEzYjg7IHRleHQtYWxpZ246IGNlbnRlcjtcIj5cbiAgICAgICAgICBTZW50IGF1dG9tYXRpY2FsbHkgZnJvbSBTb3Noa2EgU3RvcmUgQ29udGFjdCBmb3JtLlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBEZWZpbmUgbWFpbCBvcHRpb25zXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgICBmcm9tOiBgXCIke25hbWV9IChTb3Noa2EgU3RvcmUgQ29udGFjdClcIiA8JHt1c2VyfT5gLFxuICAgICAgcmVwbHlUbzogZW1haWwsXG4gICAgICB0byxcbiAgICAgIHN1YmplY3Q6IGBbU29zaGthIFN0b3JlXSBDb250YWN0IFJlcXVlc3QgZnJvbSAke25hbWV9YCxcbiAgICAgIHRleHQ6IGBOZXcgQ29udGFjdCBSZXF1ZXN0XFxuXFxuTmFtZTogJHtuYW1lfVxcbkVtYWlsOiAke2VtYWlsfVxcbk1lc3NhZ2U6ICR7bWVzc2FnZX1gLFxuICAgICAgaHRtbDogaHRtbENvbnRlbnQsXG4gICAgfTtcblxuICAgIC8vIFNlbmQgdGhlIGVtYWlsXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnRW1haWwgc2VudCBzdWNjZXNzZnVsbHknIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgZW1haWw6JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBzZW5kIGVtYWlsIG5vdGlmaWNhdGlvbicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRGVza3RvcFxcXFxTT1NIS0FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEZXNrdG9wXFxcXFNPU0hLQVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcXFxcc2hpcHJvY2tldC1waWNrdXAuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rlc2t0b3AvU09TSEtBL1Nvc2hrYS9lY29tbWVyY2UtYXBwL2FwaS9zaGlwcm9ja2V0LXBpY2t1cC5qc1wiO2ltcG9ydCBwZyBmcm9tICdwZyc7XHJcbmltcG9ydCBmcyBmcm9tICdmcyc7XHJcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xyXG5cclxuY29uc3QgeyBDbGllbnQgfSA9IHBnO1xyXG5cclxuLy8gSGVscGVyIHRvIGxvYWQgZmFsbGJhY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzIGxvY2FsbHlcclxuZnVuY3Rpb24gbG9hZEVudkZhbGxiYWNrKCkge1xyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XHJcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhlbnZQYXRoKSkge1xyXG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGVudlBhdGgsICd1dGY4Jyk7XHJcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XHJcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xyXG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcclxuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcclxuICAgICAgICAgIGNvbnN0IGZpcnN0RXF1YWwgPSB0cmltbWVkLmluZGV4T2YoJz0nKTtcclxuICAgICAgICAgIGlmIChmaXJzdEVxdWFsICE9PSAtMSkge1xyXG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJpbW1lZC5zbGljZShmaXJzdEVxdWFsICsgMSkudHJpbSgpO1xyXG4gICAgICAgICAgICBwcm9jZXNzLmVudltrZXldID0gdmFsO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGVycikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBmYWxsYmFjayAuZW52OicsIGVycik7XHJcbiAgfVxyXG59XHJcblxyXG4vLyBIZWxwZXIgdG8gcGFyc2UgcmVxdWVzdCBib2R5XHJcbmFzeW5jIGZ1bmN0aW9uIGdldFJlcXVlc3RCb2R5KHJlcSkge1xyXG4gIGlmIChyZXEuYm9keSkge1xyXG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xyXG4gIH1cclxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgbGV0IGJvZHkgPSAnJztcclxuICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHtcclxuICAgICAgYm9keSArPSBjaHVuay50b1N0cmluZygpO1xyXG4gICAgfSk7XHJcbiAgICByZXEub24oJ2VuZCcsICgpID0+IHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xyXG4gICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICByZWplY3QoZXJyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICByZXEub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKTtcclxuICB9KTtcclxufVxyXG5cclxuLy8gSGVscGVyIHRvIHNlbmQgSlNPTiByZXNwb25zZXNcclxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlKHJlcywgc3RhdHVzQ29kZSwgZGF0YSkge1xyXG4gIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoc3RhdHVzQ29kZSkuanNvbihkYXRhKTtcclxuICB9XHJcbiAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XHJcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XHJcbn1cclxuXHJcbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcclxuICAvLyBBbGxvdyBvbmx5IFBPU1QgcmVxdWVzdHNcclxuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XHJcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDA1LCB7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcclxuICB9XHJcblxyXG4gIGxvYWRFbnZGYWxsYmFjaygpO1xyXG5cclxuICBjb25zdCBlbWFpbCA9IHByb2Nlc3MuZW52LlNISVBST0NLRVRfRU1BSUw7XHJcbiAgY29uc3QgcGFzc3dvcmQgPSBwcm9jZXNzLmVudi5TSElQUk9DS0VUX1BBU1NXT1JEO1xyXG4gIGNvbnN0IHBpY2t1cExvY2F0aW9uID0gcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9QSUNLVVBfTE9DQVRJT04gfHwgJ1ByaW1hcnknO1xyXG4gIGNvbnN0IGNoYW5uZWxJZCA9IHByb2Nlc3MuZW52LlNISVBST0NLRVRfQ0hBTk5FTF9JRDtcclxuXHJcbiAgaWYgKCFlbWFpbCB8fCAhcGFzc3dvcmQgfHwgZW1haWwgPT09ICd5b3VyLXNoaXByb2NrZXQtZW1haWxAZG9tYWluLmNvbScpIHtcclxuICAgIGNvbnNvbGUud2FybignU2hpcHJvY2tldCBjcmVkZW50aWFscyBhcmUgbWlzc2luZyBvciBkZWZhdWx0IHBsYWNlaG9sZGVycy4nKTtcclxuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHtcclxuICAgICAgZXJyb3I6ICdTaGlwcm9ja2V0IGNyZWRlbnRpYWxzIGFyZSBub3QgY29uZmlndXJlZC4gUGxlYXNlIHVwZGF0ZSBTSElQUk9DS0VUX0VNQUlMIGFuZCBTSElQUk9DS0VUX1BBU1NXT1JEIGluIHlvdXIgLmVudiBmaWxlLidcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgdHJ5IHtcclxuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBnZXRSZXF1ZXN0Qm9keShyZXEpO1xyXG4gICAgY29uc3QgeyBvcmRlciwgZW1haWw6IGN1c3RvbWVyRW1haWwgfSA9IGJvZHk7XHJcblxyXG4gICAgaWYgKCFvcmRlciB8fCAhb3JkZXIuaWQgfHwgIW9yZGVyLnNoaXBwaW5nX2FkZHJlc3MgfHwgIW9yZGVyLml0ZW1zKSB7XHJcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHsgZXJyb3I6ICdNaXNzaW5nIG9yZGVyIGRldGFpbHMnIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHsgc2hpcHBpbmdfYWRkcmVzcywgaXRlbXMsIHRvdGFsLCBpZDogb3JkZXJVdWlkIH0gPSBvcmRlcjtcclxuXHJcbiAgICAvLyAxLiBBdXRoZW50aWNhdGUgd2l0aCBTaGlwcm9ja2V0XHJcbiAgICBjb25zb2xlLmxvZygnQXV0aGVudGljYXRpbmcgd2l0aCBTaGlwcm9ja2V0Li4uJyk7XHJcbiAgICBjb25zdCBhdXRoUmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9hdXRoL2xvZ2luJywge1xyXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcclxuICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0sXHJcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgZW1haWwsIHBhc3N3b3JkIH0pXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIWF1dGhSZXMub2spIHtcclxuICAgICAgY29uc3QgYXV0aEVycm9yID0gYXdhaXQgYXV0aFJlcy5qc29uKCk7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBhdXRoIGZhaWxlZDogJHthdXRoRXJyb3IubWVzc2FnZSB8fCBhdXRoUmVzLnN0YXR1c1RleHR9YCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgeyB0b2tlbiB9ID0gYXdhaXQgYXV0aFJlcy5qc29uKCk7XHJcbiAgICBjb25zb2xlLmxvZygnU2hpcHJvY2tldCBhdXRoZW50aWNhdGVkIHN1Y2Nlc3NmdWxseS4nKTtcclxuXHJcbiAgICAvLyAyLiBGb3JtYXQgb3JkZXIgZGF0ZVxyXG4gICAgY29uc3Qgb3JkZXJEYXRlID0gbmV3IERhdGUob3JkZXIuY3JlYXRlZF9hdCB8fCBEYXRlLm5vdygpKVxyXG4gICAgICAudG9JU09TdHJpbmcoKVxyXG4gICAgICAucmVwbGFjZSgnVCcsICcgJylcclxuICAgICAgLnNsaWNlKDAsIDE2KTtcclxuXHJcbiAgICAvLyBTcGxpdCBuYW1lIGludG8gZmlyc3QgYW5kIGxhc3RcclxuICAgIGNvbnN0IG5hbWVQYXJ0cyA9IChzaGlwcGluZ19hZGRyZXNzLm5hbWUgfHwgJ0N1c3RvbWVyJykudHJpbSgpLnNwbGl0KC9cXHMrLyk7XHJcbiAgICBjb25zdCBmaXJzdE5hbWUgPSBuYW1lUGFydHNbMF07XHJcbiAgICBjb25zdCBsYXN0TmFtZSA9IG5hbWVQYXJ0cy5zbGljZSgxKS5qb2luKCcgJykgfHwgJy4nO1xyXG5cclxuICAgIC8vIEZvcm1hdCBpdGVtc1xyXG4gICAgY29uc3Qgb3JkZXJJdGVtcyA9IGl0ZW1zLm1hcCgoaXRlbSwgaWR4KSA9PiAoe1xyXG4gICAgICBuYW1lOiBpdGVtLm5hbWUgfHwgYEpld2VscnkgSXRlbSAke2lkeCArIDF9YCxcclxuICAgICAgc2t1OiBpdGVtLnByb2R1Y3RfaWQgPyBpdGVtLnByb2R1Y3RfaWQuc2xpY2UoMCwgOCkgOiBgU0tVLSR7aWR4fWAsXHJcbiAgICAgIHVuaXRzOiBwYXJzZUludChpdGVtLnF1YW50aXR5IHx8ICcxJywgMTApLFxyXG4gICAgICBzZWxsaW5nX3ByaWNlOiBwYXJzZUZsb2F0KGl0ZW0ucHJpY2UgfHwgJzAnKVxyXG4gICAgfSkpO1xyXG5cclxuICAgIC8vIEJ1aWxkIHRoZSBTaGlwcm9ja2V0IEFkaG9jIE9yZGVyIHBheWxvYWRcclxuICAgIGNvbnN0IHBheWxvYWQgPSB7XHJcbiAgICAgIG9yZGVyX2lkOiBvcmRlclV1aWQuc2xpY2UoMCwgMjApLCAvLyBNYXggMjAgY2hhcmFjdGVycyBmb3IgdHlwaWNhbCBTaGlwcm9ja2V0IElEXHJcbiAgICAgIG9yZGVyX2RhdGU6IG9yZGVyRGF0ZSxcclxuICAgICAgcGlja3VwX2xvY2F0aW9uOiBwaWNrdXBMb2NhdGlvbixcclxuICAgICAgY2hhbm5lbF9pZDogY2hhbm5lbElkID8gcGFyc2VJbnQoY2hhbm5lbElkLCAxMCkgOiB1bmRlZmluZWQsXHJcbiAgICAgIGJpbGxpbmdfY3VzdG9tZXJfbmFtZTogZmlyc3ROYW1lLFxyXG4gICAgICBiaWxsaW5nX2xhc3RfbmFtZTogbGFzdE5hbWUsXHJcbiAgICAgIGJpbGxpbmdfYWRkcmVzczogc2hpcHBpbmdfYWRkcmVzcy5hZGRyZXNzTGluZSB8fCBzaGlwcGluZ19hZGRyZXNzLmFkZHJlc3MgfHwgJ0FkZHJlc3MgTGluZSAxJyxcclxuICAgICAgYmlsbGluZ19jaXR5OiBzaGlwcGluZ19hZGRyZXNzLmNpdHkgfHwgJ0NpdHknLFxyXG4gICAgICBiaWxsaW5nX3BpbmNvZGU6IHBhcnNlSW50KHNoaXBwaW5nX2FkZHJlc3MucG9zdGFsQ29kZSB8fCAnMTEwMDAxJywgMTApLFxyXG4gICAgICBiaWxsaW5nX3N0YXRlOiBzaGlwcGluZ19hZGRyZXNzLnN0YXRlIHx8ICdTdGF0ZScsXHJcbiAgICAgIGJpbGxpbmdfY291bnRyeTogJ0luZGlhJyxcclxuICAgICAgYmlsbGluZ19lbWFpbDogY3VzdG9tZXJFbWFpbCB8fCAnY3VzdG9tZXJAc29zaGthLmluJyxcclxuICAgICAgYmlsbGluZ19waG9uZTogc2hpcHBpbmdfYWRkcmVzcy5waG9uZSA/IHNoaXBwaW5nX2FkZHJlc3MucGhvbmUucmVwbGFjZSgvW14wLTldL2csICcnKSA6ICc5ODc2NTQzMjEwJyxcclxuICAgICAgc2hpcHBpbmdfaXNfYmlsbGluZzogdHJ1ZSxcclxuICAgICAgb3JkZXJfaXRlbXM6IG9yZGVySXRlbXMsXHJcbiAgICAgIHBheW1lbnRfbWV0aG9kOiAnUHJlcGFpZCcsXHJcbiAgICAgIHN1Yl90b3RhbDogcGFyc2VGbG9hdCh0b3RhbCB8fCAnMCcpLFxyXG4gICAgICBsZW5ndGg6IDEwLCAvLyBjbSAoZGVmYXVsdCBwYWNrYWdlIGJveCBzaXplKVxyXG4gICAgICBicmVhZHRoOiAxMCwgIC8vIGNtXHJcbiAgICAgIGhlaWdodDogNSwgIC8vIGNtXHJcbiAgICAgIHdlaWdodDogMC4yIC8vIGtnXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIDMuIENyZWF0ZSB0aGUgb3JkZXIgaW4gU2hpcHJvY2tldFxyXG4gICAgY29uc29sZS5sb2coJ1NlbmRpbmcgb3JkZXIgcGF5bG9hZCB0byBTaGlwcm9ja2V0Li4uJyk7XHJcbiAgICBjb25zdCBjcmVhdGVPcmRlclJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaXYyLnNoaXByb2NrZXQuaW4vdjEvZXh0ZXJuYWwvb3JkZXJzL2NyZWF0ZS9hZGhvYycsIHtcclxuICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3Rva2VufWBcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocGF5bG9hZClcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghY3JlYXRlT3JkZXJSZXMub2spIHtcclxuICAgICAgY29uc3QgY3JlYXRlRXJyb3JNc2cgPSBhd2FpdCBjcmVhdGVPcmRlclJlcy50ZXh0KCk7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1NoaXByb2NrZXQgb3JkZXIgY3JlYXRpb24gZXJyb3IgcmVzcG9uc2U6JywgY3JlYXRlRXJyb3JNc2cpO1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNoaXByb2NrZXQgb3JkZXIgY3JlYXRpb24gZmFpbGVkOiAke2NyZWF0ZUVycm9yTXNnfWApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGNyZWF0ZURhdGEgPSBhd2FpdCBjcmVhdGVPcmRlclJlcy5qc29uKCk7XHJcbiAgICBjb25zb2xlLmxvZygnU2hpcHJvY2tldCBvcmRlciBjcmVhdGVkOicsIGNyZWF0ZURhdGEpO1xyXG5cclxuICAgIGxldCBzaGlwbWVudElkID0gbnVsbDtcclxuICAgIGxldCBhd2JDb2RlID0gJyc7XHJcblxyXG4gICAgaWYgKGNyZWF0ZURhdGEuc2hpcG1lbnRfaWQpIHtcclxuICAgICAgc2hpcG1lbnRJZCA9IGNyZWF0ZURhdGEuc2hpcG1lbnRfaWQ7XHJcbiAgICAgIGF3YkNvZGUgPSBjcmVhdGVEYXRhLmF3Yl9jb2RlIHx8ICcnO1xyXG4gICAgfSBlbHNlIGlmIChjcmVhdGVEYXRhLmRhdGEgJiYgY3JlYXRlRGF0YS5kYXRhLnNoaXBtZW50X2lkKSB7XHJcbiAgICAgIHNoaXBtZW50SWQgPSBjcmVhdGVEYXRhLmRhdGEuc2hpcG1lbnRfaWQ7XHJcbiAgICAgIGF3YkNvZGUgPSBjcmVhdGVEYXRhLmRhdGEuYXdiX2NvZGUgfHwgJyc7XHJcbiAgICB9IGVsc2UgaWYgKGNyZWF0ZURhdGEuZGF0YSAmJiBjcmVhdGVEYXRhLmRhdGEuZGF0YSAmJiBBcnJheS5pc0FycmF5KGNyZWF0ZURhdGEuZGF0YS5kYXRhKSAmJiBjcmVhdGVEYXRhLmRhdGEuZGF0YVswXSkge1xyXG4gICAgICBzaGlwbWVudElkID0gY3JlYXRlRGF0YS5kYXRhLmRhdGFbMF0uc2hpcG1lbnRfaWQ7XHJcbiAgICAgIGF3YkNvZGUgPSBjcmVhdGVEYXRhLmRhdGEuZGF0YVswXS5hd2JfY29kZSB8fCAnJztcclxuICAgIH0gZWxzZSBpZiAoY3JlYXRlRGF0YS5kYXRhICYmIEFycmF5LmlzQXJyYXkoY3JlYXRlRGF0YS5kYXRhKSAmJiBjcmVhdGVEYXRhLmRhdGFbMF0pIHtcclxuICAgICAgc2hpcG1lbnRJZCA9IGNyZWF0ZURhdGEuZGF0YVswXS5zaGlwbWVudF9pZDtcclxuICAgICAgYXdiQ29kZSA9IGNyZWF0ZURhdGEuZGF0YVswXS5hd2JfY29kZSB8fCAnJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoIXNoaXBtZW50SWQpIHtcclxuICAgICAgaWYgKGNyZWF0ZURhdGEubWVzc2FnZSkge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBvcmRlciBjcmVhdGlvbiBmYWlsZWQ6ICR7Y3JlYXRlRGF0YS5tZXNzYWdlfWApO1xyXG4gICAgICB9XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBkaWQgbm90IHJldHVybiBhIHNoaXBtZW50IElELiBSZXNwb25zZTogJHtKU09OLnN0cmluZ2lmeShjcmVhdGVEYXRhKX1gKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyA0LiBTY2hlZHVsZSBjb3VyaWVyIHBpY2t1cFxyXG4gICAgY29uc29sZS5sb2coYFNjaGVkdWxpbmcgcGlja3VwIGZvciBzaGlwbWVudDogJHtzaGlwbWVudElkfS4uLmApO1xyXG4gICAgY29uc3QgcGlja3VwUmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9jb3VyaWVyL2dlbmVyYXRlL3BpY2t1cCcsIHtcclxuICAgICAgbWV0aG9kOiAnUE9TVCcsXHJcbiAgICAgIGhlYWRlcnM6IHtcclxuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nLFxyXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3Rva2VufWBcclxuICAgICAgfSxcclxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xyXG4gICAgICAgIHNoaXBtZW50X2lkOiBbc2hpcG1lbnRJZF1cclxuICAgICAgfSlcclxuICAgIH0pO1xyXG5cclxuICAgIGlmICghcGlja3VwUmVzLm9rKSB7XHJcbiAgICAgIGNvbnN0IHBpY2t1cEVycm9yID0gYXdhaXQgcGlja3VwUmVzLnRleHQoKTtcclxuICAgICAgY29uc29sZS53YXJuKCdTaGlwcm9ja2V0IHBpY2t1cCBzY2hlZHVsaW5nIHdhcm5pbmcgKG1pZ2h0IG5lZWQgbWFudWFsbHkgYXBwcm92ZWQvcmUtc2NoZWR1bGVkKTonLCBwaWNrdXBFcnJvcik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjb25zdCBwaWNrdXBEYXRhID0gYXdhaXQgcGlja3VwUmVzLmpzb24oKTtcclxuICAgICAgY29uc29sZS5sb2coJ1NoaXByb2NrZXQgcGlja3VwIHNjaGVkdWxlZCBzdWNjZXNzZnVsbHk6JywgcGlja3VwRGF0YSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gNS4gU2F2ZSBzaGlwbWVudCBtZXRhZGF0YSBpbiBTdXBhYmFzZVxyXG4gICAgY29uc29sZS5sb2coJ1NhdmluZyBzaGlwbWVudCBkZXRhaWxzIGluIGxvY2FsIGRhdGFiYXNlLi4uJyk7XHJcbiAgICBjb25zdCBwZ0Nvbm5lY3Rpb25TdHJpbmcgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkw7XHJcbiAgICBpZiAoIXBnQ29ubmVjdGlvblN0cmluZykge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RBVEFCQVNFX1VSTCBpcyBub3QgY29uZmlndXJlZCBpbiB0aGUgZW52aXJvbm1lbnQuJyk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBkYkNsaWVudCA9IG5ldyBDbGllbnQoe1xyXG4gICAgICBjb25uZWN0aW9uU3RyaW5nOiBwZ0Nvbm5lY3Rpb25TdHJpbmcsXHJcbiAgICAgIHNzbDogeyByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGF3YWl0IGRiQ2xpZW50LmNvbm5lY3QoKTtcclxuICAgIFxyXG4gICAgYXdhaXQgZGJDbGllbnQucXVlcnkoYFxyXG4gICAgICBVUERBVEUgcHVibGljLm9yZGVyc1xyXG4gICAgICBTRVQgc2hpcHJvY2tldF9zaGlwbWVudF9pZCA9ICQxLCBzaGlwcm9ja2V0X2F3YiA9ICQyXHJcbiAgICAgIFdIRVJFIGlkID0gJDNcclxuICAgIGAsIFtTdHJpbmcoc2hpcG1lbnRJZCksIFN0cmluZyhhd2JDb2RlKSwgb3JkZXJVdWlkXSk7XHJcblxyXG4gICAgYXdhaXQgZGJDbGllbnQuZW5kKCk7XHJcbiAgICBjb25zb2xlLmxvZygnT3JkZXIgc2hpcG1lbnQgbWV0YWRhdGEgdXBkYXRlZCBpbiBkYXRhYmFzZSBzdWNjZXNzZnVsbHkhJyk7XHJcblxyXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwge1xyXG4gICAgICBzdWNjZXNzOiB0cnVlLFxyXG4gICAgICBzaGlwbWVudF9pZDogc2hpcG1lbnRJZCxcclxuICAgICAgYXdiX2NvZGU6IGF3YkNvZGVcclxuICAgIH0pO1xyXG5cclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgaGFuZGxpbmcgU2hpcHJvY2tldCBpbnRlZ3JhdGlvbjonLCBlcnJvcik7XHJcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNTAwLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdJbnRlcm5hbCBTaGlwcm9ja2V0IHNlcnZlciBlcnJvcicgfSk7XHJcbiAgfVxyXG59XHJcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRGVza3RvcFxcXFxTT1NIS0FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEZXNrdG9wXFxcXFNPU0hLQVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcXFxcc2VuZC1vcmRlci1jb25maXJtYXRpb24uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rlc2t0b3AvU09TSEtBL1Nvc2hrYS9lY29tbWVyY2UtYXBwL2FwaS9zZW5kLW9yZGVyLWNvbmZpcm1hdGlvbi5qc1wiO2ltcG9ydCBub2RlbWFpbGVyIGZyb20gJ25vZGVtYWlsZXInO1xyXG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuXHJcbi8vIEhlbHBlciB0byBsb2FkIGZhbGxiYWNrIGVudmlyb25tZW50IHZhcmlhYmxlcyBsb2NhbGx5XHJcbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgZW52UGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnLmVudicpO1xyXG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcclxuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCAndXRmOCcpO1xyXG4gICAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoJ1xcbicpO1xyXG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcclxuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XHJcbiAgICAgICAgaWYgKHRyaW1tZWQgJiYgIXRyaW1tZWQuc3RhcnRzV2l0aCgnIycpKSB7XHJcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XHJcbiAgICAgICAgICBpZiAoZmlyc3RFcXVhbCAhPT0gLTEpIHtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gdHJpbW1lZC5zbGljZSgwLCBmaXJzdEVxdWFsKS50cmltKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcclxuICAgICAgICAgICAgcHJvY2Vzcy5lbnZba2V5XSA9IHZhbDtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9IGNhdGNoIChlcnIpIHtcclxuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZmFsbGJhY2sgLmVudjonLCBlcnIpO1xyXG4gIH1cclxufVxyXG5cclxuLy8gSGVscGVyIHRvIHBhcnNlIHJlcXVlc3QgYm9keVxyXG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcclxuICBpZiAocmVxLmJvZHkpIHtcclxuICAgIHJldHVybiB0eXBlb2YgcmVxLmJvZHkgPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShyZXEuYm9keSkgOiByZXEuYm9keTtcclxuICB9XHJcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgIGxldCBib2R5ID0gJyc7XHJcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XHJcbiAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTtcclxuICAgIH0pO1xyXG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgcmVzb2x2ZShib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9KTtcclxuICAgICAgfSBjYXRjaCAoZXJyKSB7XHJcbiAgICAgICAgcmVqZWN0KGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgcmVxLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSk7XHJcbiAgfSk7XHJcbn1cclxuXHJcbi8vIEhlbHBlciB0byBzZW5kIEpTT04gcmVzcG9uc2VzXHJcbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShyZXMsIHN0YXR1c0NvZGUsIGRhdGEpIHtcclxuICBpZiAodHlwZW9mIHJlcy5zdGF0dXMgPT09ICdmdW5jdGlvbicpIHtcclxuICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oZGF0YSk7XHJcbiAgfVxyXG4gIHJlcy53cml0ZUhlYWQoc3RhdHVzQ29kZSwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xyXG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG59XHJcblxyXG4vLyBGb3JtYXQgY3VycmVuY3kgaW4gSW5kaWFuIFJ1cGVlc1xyXG5mdW5jdGlvbiBmb3JtYXRJTlIodmFsdWUpIHtcclxuICByZXR1cm4gbmV3IEludGwuTnVtYmVyRm9ybWF0KCdlbi1JTicsIHtcclxuICAgIHN0eWxlOiAnY3VycmVuY3knLFxyXG4gICAgY3VycmVuY3k6ICdJTlInLFxyXG4gICAgbWluaW11bUZyYWN0aW9uRGlnaXRzOiAyXHJcbiAgfSkuZm9ybWF0KHZhbHVlKTtcclxufVxyXG5cclxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xyXG4gIC8vIEFsbG93IG9ubHkgUE9TVCByZXF1ZXN0c1xyXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcclxuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDUsIHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xyXG4gIH1cclxuXHJcbiAgbG9hZEVudkZhbGxiYWNrKCk7XHJcblxyXG4gIHRyeSB7XHJcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgZ2V0UmVxdWVzdEJvZHkocmVxKTtcclxuICAgIGNvbnN0IHsgb3JkZXIsIGVtYWlsIH0gPSBib2R5O1xyXG5cclxuICAgIGlmICghb3JkZXIpIHtcclxuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwgeyBlcnJvcjogJ09yZGVyIGRldGFpbHMgYXJlIHJlcXVpcmVkJyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgY3VzdG9tZXJFbWFpbCA9IGVtYWlsO1xyXG4gICAgaWYgKCFjdXN0b21lckVtYWlsICYmIG9yZGVyLnNoaXBwaW5nX2FkZHJlc3M/LmVtYWlsKSB7XHJcbiAgICAgIGN1c3RvbWVyRW1haWwgPSBvcmRlci5zaGlwcGluZ19hZGRyZXNzLmVtYWlsO1xyXG4gICAgICBjb25zb2xlLmxvZygnRm91bmQgY3VzdG9tZXIgZW1haWwgZnJvbSBvcmRlci5zaGlwcGluZ19hZGRyZXNzOicsIGN1c3RvbWVyRW1haWwpO1xyXG4gICAgfVxyXG4gICAgaWYgKCFjdXN0b21lckVtYWlsICYmIG9yZGVyLnVzZXJfaWQpIHtcclxuICAgICAgY29uc29sZS5sb2coJ0VtYWlsIG5vdCBwcm92aWRlZCBpbiBib2R5LiBRdWVyeWluZyBkYXRhYmFzZSBmb3IgdXNlciBlbWFpbC4uLicpO1xyXG4gICAgICBjb25zdCBwZ0Nvbm5lY3Rpb25TdHJpbmcgPSBwcm9jZXNzLmVudi5EQVRBQkFTRV9VUkw7XHJcbiAgICAgIGlmIChwZ0Nvbm5lY3Rpb25TdHJpbmcpIHtcclxuICAgICAgICB0cnkge1xyXG4gICAgICAgICAgY29uc3QgeyBDbGllbnQgfSA9IGF3YWl0IGltcG9ydCgncGcnKTtcclxuICAgICAgICAgIGNvbnN0IGRiQ2xpZW50ID0gbmV3IENsaWVudCh7XHJcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TdHJpbmc6IHBnQ29ubmVjdGlvblN0cmluZyxcclxuICAgICAgICAgICAgc3NsOiB7IHJlamVjdFVuYXV0aG9yaXplZDogZmFsc2UgfVxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgICBhd2FpdCBkYkNsaWVudC5jb25uZWN0KCk7XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIC8vIFRyeSB0byBmZXRjaCBmcm9tIHByb2ZpbGVzIGZpcnN0XHJcbiAgICAgICAgICBjb25zdCBwcm9maWxlUmVzID0gYXdhaXQgZGJDbGllbnQucXVlcnkoJ1NFTEVDVCBlbWFpbCBGUk9NIHB1YmxpYy5wcm9maWxlcyBXSEVSRSBpZCA9ICQxJywgW29yZGVyLnVzZXJfaWRdKTtcclxuICAgICAgICAgIGlmIChwcm9maWxlUmVzLnJvd3MgJiYgcHJvZmlsZVJlcy5yb3dzWzBdPy5lbWFpbCkge1xyXG4gICAgICAgICAgICBjdXN0b21lckVtYWlsID0gcHJvZmlsZVJlcy5yb3dzWzBdLmVtYWlsO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY3VzdG9tZXIgZW1haWwgZnJvbSBwdWJsaWMucHJvZmlsZXM6JywgY3VzdG9tZXJFbWFpbCk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBUcnkgdG8gZmV0Y2ggZnJvbSBhdXRoLnVzZXJzIChyZXF1aXJlcyBEQiBhY2Nlc3MgcHJpdmlsZWdlcylcclxuICAgICAgICAgICAgY29uc3QgdXNlclJlcyA9IGF3YWl0IGRiQ2xpZW50LnF1ZXJ5KCdTRUxFQ1QgZW1haWwgRlJPTSBhdXRoLnVzZXJzIFdIRVJFIGlkID0gJDEnLCBbb3JkZXIudXNlcl9pZF0pO1xyXG4gICAgICAgICAgICBpZiAodXNlclJlcy5yb3dzICYmIHVzZXJSZXMucm93c1swXT8uZW1haWwpIHtcclxuICAgICAgICAgICAgICBjdXN0b21lckVtYWlsID0gdXNlclJlcy5yb3dzWzBdLmVtYWlsO1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGb3VuZCBjdXN0b21lciBlbWFpbCBmcm9tIGF1dGgudXNlcnM6JywgY3VzdG9tZXJFbWFpbCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGF3YWl0IGRiQ2xpZW50LmVuZCgpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGRiRXJyKSB7XHJcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB1c2VyIGVtYWlsIGZyb20gREI6JywgZGJFcnIpO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmICghY3VzdG9tZXJFbWFpbCkge1xyXG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnQ3VzdG9tZXIgZW1haWwgYWRkcmVzcyBpcyByZXF1aXJlZCcgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LlNNVFBfSE9TVDtcclxuICAgIGNvbnN0IHBvcnQgPSBwYXJzZUludChwcm9jZXNzLmVudi5TTVRQX1BPUlQgfHwgJzU4NycsIDEwKTtcclxuICAgIGNvbnN0IHVzZXIgPSBwcm9jZXNzLmVudi5TTVRQX1VTRVI7XHJcbiAgICBjb25zdCBwYXNzID0gcHJvY2Vzcy5lbnYuU01UUF9QQVNTO1xyXG5cclxuICAgIC8vIFZlcmlmeSBTTVRQIHNldHRpbmdzXHJcbiAgICBpZiAoIWhvc3QgfHwgIXVzZXIgfHwgIXBhc3MpIHtcclxuICAgICAgY29uc29sZS53YXJuKCdTTVRQIGNvbmZpZ3VyYXRpb24gaXMgbWlzc2luZy4nKTtcclxuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwge1xyXG4gICAgICAgIGVycm9yOiAnU01UUCBjcmVkZW50aWFscyBhcmUgbm90IGZ1bGx5IGNvbmZpZ3VyZWQgaW4geW91ciBlbnZpcm9ubWVudC4nXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIFJlY2FsY3VsYXRlIGNhbGN1bGF0aW9ucyB0byB2ZXJpZnkgaW52b2ljZSBzcGxpdHNcclxuICAgIGNvbnN0IGl0ZW1zID0gb3JkZXIuaXRlbXMgfHwgW107XHJcbiAgICBjb25zdCBzdWJ0b3RhbCA9IGl0ZW1zLnJlZHVjZSgoYWNjLCBpdGVtKSA9PiBhY2MgKyAoaXRlbS5wcmljZSAqIGl0ZW0ucXVhbnRpdHkpLCAwKTtcclxuICAgIGNvbnN0IGRpc3BsYXlPcmRlcklkID0gb3JkZXIuaWQuc3RhcnRzV2l0aCgnMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtJykgPyBvcmRlci5pZC5zcGxpdCgnLScpLnBvcCgpIDogb3JkZXIuaWQuc2xpY2UoMCwgOCkudG9VcHBlckNhc2UoKTtcclxuICAgIFxyXG4gICAgLy8gVXNlIGltcG9ydGVkIGNvbnN0YW50cyBlcXVpdmFsZW50IGxvZ2ljXHJcbiAgICBjb25zdCBTSElQUElOR19DSEFSR0VTID0gMDtcclxuICAgIGNvbnN0IEZSRUVfU0hJUFBJTkdfVEhSRVNIT0xEID0gMDtcclxuICAgIGNvbnN0IFRBWF9SQVRFID0gMC4wMDtcclxuXHJcbiAgICBjb25zdCBzaGlwcGluZ0Nvc3QgPSAwO1xyXG4gICAgY29uc3QgdGF4Q29zdCA9IDA7XHJcblxyXG4gICAgLy8gQ3JlYXRlIGEgbm9kZW1haWxlciB0cmFuc3BvcnRlclxyXG4gICAgY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XHJcbiAgICAgIGhvc3QsXHJcbiAgICAgIHBvcnQsXHJcbiAgICAgIHNlY3VyZTogcG9ydCA9PT0gNDY1LFxyXG4gICAgICBhdXRoOiB7XHJcbiAgICAgICAgdXNlcixcclxuICAgICAgICBwYXNzLFxyXG4gICAgICB9LFxyXG4gICAgICB0bHM6IHtcclxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEJ1aWxkIHRoZSBwcmVtaXVtIHRoZW1lZCBTXHUwMEY1c2hrYSBPcmRlciBJbnZvaWNlXHJcbiAgICBjb25zdCBodG1sQ29udGVudCA9IGBcclxuICAgICAgPCFET0NUWVBFIGh0bWw+XHJcbiAgICAgIDxodG1sPlxyXG4gICAgICA8aGVhZD5cclxuICAgICAgICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIj5cclxuICAgICAgICA8c3R5bGU+XHJcbiAgICAgICAgICBib2R5IHtcclxuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdIZWx2ZXRpY2EgTmV1ZScsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWY7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmYWZhZmE7XHJcbiAgICAgICAgICAgIG1hcmdpbjogMDtcclxuICAgICAgICAgICAgcGFkZGluZzogMDtcclxuICAgICAgICAgICAgY29sb3I6ICMyNjI2MjY7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuZW1haWwtY29udGFpbmVyIHtcclxuICAgICAgICAgICAgbWF4LXdpZHRoOiA2MDBweDtcclxuICAgICAgICAgICAgbWFyZ2luOiAzMHB4IGF1dG87XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICNmZmZmZmY7XHJcbiAgICAgICAgICAgIGJvcmRlcjogMXB4IHNvbGlkICNlYWVhZWE7XHJcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDE2cHg7XHJcbiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XHJcbiAgICAgICAgICAgIGJveC1zaGFkb3c6IDAgNHB4IDEycHggcmdiYSgwLDAsMCwwLjAzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5icmFuZC1oZWFkZXIge1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjOTgxODNmO1xyXG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWltYWdlOiBsaW5lYXItZ3JhZGllbnQoMTM1ZGVnLCAjOTgxODNmIDAlLCAjNjQwZjI4IDEwMCUpO1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xyXG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBjZW50ZXI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuYnJhbmQtbmFtZSB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMjhweDtcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDgwMDtcclxuICAgICAgICAgICAgY29sb3I6ICNmZmZmZmY7XHJcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiA0cHg7XHJcbiAgICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XHJcbiAgICAgICAgICAgIG1hcmdpbjogMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5icmFuZC1zdWJ0aXRsZSB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICAgICAgICAgICAgY29sb3I6ICNmN2EwYjk7XHJcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAycHg7XHJcbiAgICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XHJcbiAgICAgICAgICAgIG1hcmdpbjogNXB4IDAgMCAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLmludm9pY2UtYm9keSB7XHJcbiAgICAgICAgICAgIHBhZGRpbmc6IDM1cHg7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuZ3JlZXRpbmcge1xyXG4gICAgICAgICAgICBmb250LXNpemU6IDE4cHg7XHJcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XHJcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDA7XHJcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDhweDtcclxuICAgICAgICAgICAgY29sb3I6ICMxYTFhMWE7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAub3JkZXItc3RhdHVzLWJhbm5lciB7XHJcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZGYyZjU7XHJcbiAgICAgICAgICAgIGJvcmRlci1sZWZ0OiA0cHggc29saWQgI2ZmMmE4NTtcclxuICAgICAgICAgICAgcGFkZGluZzogMTVweDtcclxuICAgICAgICAgICAgbWFyZ2luOiAyMHB4IDA7XHJcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDRweDtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xyXG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xyXG4gICAgICAgICAgICBjb2xvcjogIzk4MTgzZjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5tZXRhLXRhYmxlIHtcclxuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XHJcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDI1cHg7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcclxuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNlYWVhZWE7XHJcbiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAxNXB4O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLm1ldGEtbGFiZWwge1xyXG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcclxuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcclxuICAgICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDFweDtcclxuICAgICAgICAgICAgd2lkdGg6IDMwJTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5tZXRhLXZhbHVlIHtcclxuICAgICAgICAgICAgY29sb3I6ICMyNjI2MjY7XHJcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuaXRlbXMtdGFibGUge1xyXG4gICAgICAgICAgICB3aWR0aDogMTAwJTtcclxuICAgICAgICAgICAgYm9yZGVyLWNvbGxhcHNlOiBjb2xsYXBzZTtcclxuICAgICAgICAgICAgbWFyZ2luOiAyMHB4IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuaXRlbXMtaGVhZGVyIHtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xyXG4gICAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xyXG4gICAgICAgICAgICBmb250LXdlaWdodDogODAwO1xyXG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcclxuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICNlYWVhZWE7XHJcbiAgICAgICAgICAgIHBhZGRpbmctYm90dG9tOiAxMHB4O1xyXG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBsZWZ0O1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLml0ZW0tcm93IHRkIHtcclxuICAgICAgICAgICAgcGFkZGluZzogMTVweCAwO1xyXG4gICAgICAgICAgICBib3JkZXItYm90dG9tOiAxcHggc29saWQgI2Y1ZjVmNTtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAxM3B4O1xyXG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLml0ZW0tbmFtZSB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjMWExYTFhO1xyXG4gICAgICAgICAgICBmb250LXdlaWdodDogNzAwO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLml0ZW0tbWV0YSB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcclxuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XHJcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XHJcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDRweDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5jYWxjdWxhdGlvbi1zZWN0aW9uIHtcclxuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XHJcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDE1cHg7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuY2FsY3VsYXRpb24tcm93IHRkIHtcclxuICAgICAgICAgICAgcGFkZGluZzogOHB4IDA7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTNweDtcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDYwMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5jYWxjdWxhdGlvbi1sYWJlbCB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjOGM4YzhjO1xyXG4gICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcclxuICAgICAgICAgICAgcGFkZGluZy1yaWdodDogMjVweDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5jYWxjdWxhdGlvbi12YWwge1xyXG4gICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcclxuICAgICAgICAgICAgd2lkdGg6IDI1JTtcclxuICAgICAgICAgICAgY29sb3I6ICMyNjI2MjY7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAudG90YWwtcm93IHRkIHtcclxuICAgICAgICAgICAgYm9yZGVyLXRvcDogMnB4IHNvbGlkICNlYWVhZWE7XHJcbiAgICAgICAgICAgIHBhZGRpbmctdG9wOiAxNXB4ICFpbXBvcnRhbnQ7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTZweCAhaW1wb3J0YW50O1xyXG4gICAgICAgICAgICBmb250LXdlaWdodDogODAwICFpbXBvcnRhbnQ7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAudG90YWwtcm93IC5jYWxjdWxhdGlvbi1sYWJlbCB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjMWExYTFhO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLnRvdGFsLXJvdyAuY2FsY3VsYXRpb24tdmFsIHtcclxuICAgICAgICAgICAgY29sb3I6ICM5ODE4M2Y7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuYWRkcmVzcy1jYXJkIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2ZjZmNmYztcclxuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2YwZjBmMDtcclxuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogOHB4O1xyXG4gICAgICAgICAgICBwYWRkaW5nOiAyMHB4O1xyXG4gICAgICAgICAgICBtYXJnaW4tdG9wOiAzMHB4O1xyXG4gICAgICAgICAgICBmb250LXNpemU6IDEycHg7XHJcbiAgICAgICAgICAgIGxpbmUtaGVpZ2h0OiAxLjY7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuYWRkcmVzcy10aXRsZSB7XHJcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDgwMDtcclxuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcclxuICAgICAgICAgICAgbGV0dGVyLXNwYWNpbmc6IDFweDtcclxuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XHJcbiAgICAgICAgICAgIG1hcmdpbi1ib3R0b206IDEwcHg7XHJcbiAgICAgICAgICAgIG1hcmdpbi10b3A6IDA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAuYnJhbmQtZm9vdGVyIHtcclxuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogI2Y3ZjdmNztcclxuICAgICAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlYWVhZWE7XHJcbiAgICAgICAgICAgIHBhZGRpbmc6IDI1cHg7XHJcbiAgICAgICAgICAgIHRleHQtYWxpZ246IGNlbnRlcjtcclxuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xyXG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcclxuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDUwMDtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC5icmFuZC1mb290ZXIgYSB7XHJcbiAgICAgICAgICAgIGNvbG9yOiAjOTgxODNmO1xyXG4gICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XHJcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2NTA7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgPC9zdHlsZT5cclxuICAgICAgPC9oZWFkPlxyXG4gICAgICA8Ym9keT5cclxuICAgICAgICA8ZGl2IGNsYXNzPVwiZW1haWwtY29udGFpbmVyXCI+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnJhbmQtaGVhZGVyXCI+XHJcbiAgICAgICAgICAgIDxoMSBjbGFzcz1cImJyYW5kLW5hbWVcIj5TXHUwMEY1c2hrYTwvaDE+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzPVwiYnJhbmQtc3VidGl0bGVcIj5GaW5lIEpld2VsbGVyeTwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW52b2ljZS1ib2R5XCI+XHJcbiAgICAgICAgICAgIDxoMiBjbGFzcz1cImdyZWV0aW5nXCI+VGhhbmsgWW91IGZvciBZb3VyIE9yZGVyITwvaDI+XHJcbiAgICAgICAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxM3B4OyBjb2xvcjogIzY2NjsgbWFyZ2luOiAwIDAgMjBweCAwOyBsaW5lLWhlaWdodDogMS41O1wiPlxyXG4gICAgICAgICAgICAgIFdlIGhhdmUgcmVjZWl2ZWQgeW91ciBwdXJjaGFzZSByZXF1ZXN0LiBPdXIgYXJ0aXNhbnMgYXJlIHByZXBhcmluZyB5b3VyIHNlbGVjdGVkIGl0ZW1zIHdpdGggY2FyZS4gWW91IGNhbiBmaW5kIHlvdXIgb3JkZXIgcmVjZWlwdCBkZXRhaWxzIG91dGxpbmVkIGJlbG93OlxyXG4gICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3JkZXItc3RhdHVzLWJhbm5lclwiPlxyXG4gICAgICAgICAgICAgIFlvdXIgb3JkZXIgY29uZmlybWF0aW9uIHN0YXR1cyBpcyBjdXJyZW50bHk6IDxzdHJvbmc+UFJPQ0VTU0lORzwvc3Ryb25nPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cIm1ldGEtdGFibGVcIj5cclxuICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLWxhYmVsXCI+T3JkZXIgTnVtYmVyPC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm1ldGEtdmFsdWVcIj4ke2Rpc3BsYXlPcmRlcklkfTwvdGQ+XHJcbiAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLWxhYmVsXCI+RGF0ZSBQbGFjZWQ8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS12YWx1ZVwiPiR7bmV3IERhdGUob3JkZXIuY3JlYXRlZF9hdCB8fCBEYXRlLm5vdygpKS50b0xvY2FsZVN0cmluZygnZW4tSU4nLCB7IHRpbWVab25lOiAnQXNpYS9Lb2xrYXRhJyB9KX08L3RkPlxyXG4gICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS1sYWJlbFwiPlRyYW5zYWN0aW9uIElEPC90ZD5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm1ldGEtdmFsdWVcIiBzdHlsZT1cImZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XCI+JHtvcmRlci5wYXltZW50X2lkIHx8ICdDYXNoIG9uIERlbGl2ZXJ5J308L3RkPlxyXG4gICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcblxyXG4gICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJpdGVtcy10YWJsZVwiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZD5cclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwiaXRlbXMtaGVhZGVyXCIgc3R5bGU9XCJ3aWR0aDogNjAlO1wiPkpld2VscnkgSXRlbTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cIml0ZW1zLWhlYWRlclwiIHN0eWxlPVwid2lkdGg6IDE1JTsgdGV4dC1hbGlnbjogY2VudGVyO1wiPlF0eTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cIml0ZW1zLWhlYWRlclwiIHN0eWxlPVwid2lkdGg6IDI1JTsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+VG90YWwgUHJpY2U8L3RoPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICAgIDx0Ym9keT5cclxuICAgICAgICAgICAgICAgICR7aXRlbXMubWFwKGl0ZW0gPT4gYFxyXG4gICAgICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJpdGVtLXJvd1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzPVwiaXRlbS1uYW1lXCI+JHtpdGVtLm5hbWV9PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cIml0ZW0tbWV0YVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBVbml0IFByaWNlOiAke2Zvcm1hdElOUihpdGVtLnByaWNlKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgJHtpdGVtLnNpemUgPyBgIHwgU2l6ZTogPHN0cm9uZz4ke2l0ZW0uc2l6ZX08L3N0cm9uZz5gIDogJyd9XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBzdHlsZT1cInRleHQtYWxpZ246IGNlbnRlcjsgY29sb3I6ICM2NjY7XCI+JHtpdGVtLnF1YW50aXR5fTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIHN0eWxlPVwidGV4dC1hbGlnbjogcmlnaHQ7IGNvbG9yOiAjMWExYTFhO1wiPiR7Zm9ybWF0SU5SKGl0ZW0ucHJpY2UgKiBpdGVtLnF1YW50aXR5KX08L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgYCkuam9pbignJyl9XHJcbiAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuXHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzcz1cImNhbGN1bGF0aW9uLXNlY3Rpb25cIj5cclxuICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3dcIj5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+U3VidG90YWw8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tdmFsXCI+JHtmb3JtYXRJTlIoc3VidG90YWwpfTwvdGQ+XHJcbiAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAke29yZGVyLmNvZF9mZWUgJiYgTnVtYmVyKG9yZGVyLmNvZF9mZWUpID4gMCA/IGBcclxuICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3dcIj5cclxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+Q2FzaCBvbiBEZWxpdmVyeSAoQ09EKSBGZWU8L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tdmFsXCI+JHtmb3JtYXRJTlIob3JkZXIuY29kX2ZlZSl9PC90ZD5cclxuICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgIGAgOiAnJ31cclxuICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3cgdG90YWwtcm93XCI+XHJcbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxjdWxhdGlvbi1sYWJlbFwiPiR7b3JkZXIucGF5bWVudF9tZXRob2QgPT09ICdjb2QnID8gJ1RvdGFsIEFtb3VudCB0byBQYXknIDogJ1RvdGFsIEFtb3VudCBQYWlkJ308L3RkPlxyXG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tdmFsXCI+JHtmb3JtYXRJTlIob3JkZXIudG90YWwpfTwvdGQ+XHJcbiAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJhZGRyZXNzLWNhcmRcIj5cclxuICAgICAgICAgICAgICA8aDQgY2xhc3M9XCJhZGRyZXNzLXRpdGxlXCI+XHVEODNEXHVEQ0NEIERpc3BhdGNoIEFkZHJlc3M8L2g0PlxyXG4gICAgICAgICAgICAgIDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogIzFhMWExYTsgZm9udC1zaXplOiAxM3B4O1wiPiR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ubmFtZX08L3N0cm9uZz48YnIgLz5cclxuICAgICAgICAgICAgICAke29yZGVyLnNoaXBwaW5nX2FkZHJlc3M/LmFkZHJlc3NMaW5lIHx8IG9yZGVyLnNoaXBwaW5nX2FkZHJlc3M/LmxpbmUxfTxiciAvPlxyXG4gICAgICAgICAgICAgICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8uY2l0eX0sICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8uc3RhdGV9IC0gJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5wb3N0YWxDb2RlIHx8IG9yZGVyLnNoaXBwaW5nX2FkZHJlc3M/LnBvc3RhbF9jb2RlfTxiciAvPlxyXG4gICAgICAgICAgICAgIENvbnRhY3Q6ICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ucGhvbmV9XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICBcclxuICAgICAgICAgIDxkaXYgY2xhc3M9XCJicmFuZC1mb290ZXJcIj5cclxuICAgICAgICAgICAgPHA+SWYgeW91IGhhdmUgYW55IHF1ZXN0aW9ucywgcGxlYXNlIGNvbnRhY3Qgb3VyIGN1c3RvbSBzZXJ2aWNlIGRlc2sgYXQgPGEgaHJlZj1cIm1haWx0bzpzdXBwb3J0QHNvc2hrYS5pblwiPnN1cHBvcnRAc29zaGthLmluPC9hPjwvcD5cclxuICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW4tdG9wOiAxNXB4OyBmb250LXNpemU6IDEwcHg7IGNvbG9yOiAjYjViNWI1O1wiPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gU1x1MDBGNXNoa2EgU3RvcmUuIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvYm9keT5cclxuICAgICAgPC9odG1sPlxyXG4gICAgYDtcclxuXHJcbiAgICAvLyBEZWZpbmUgbWFpbCBvcHRpb25zXHJcbiAgICBjb25zdCBtYWlsT3B0aW9ucyA9IHtcclxuICAgICAgZnJvbTogYFwiU29zaGthIEpld2VsbGVyeVwiIDwke3VzZXJ9PmAsXHJcbiAgICAgIHRvOiBjdXN0b21lckVtYWlsLFxyXG4gICAgICByZXBseVRvOiBcInNvc2hrYS5pbkBnbWFpbC5jb21cIixcclxuICAgICAgc3ViamVjdDogYE9yZGVyIENvbmZpcm1lZCAtIEludm9pY2UgIyR7ZGlzcGxheU9yZGVySWR9IHwgU29zaGthYCxcclxuICAgICAgdGV4dDogYFRoYW5rIHlvdSBmb3IgeW91ciBwdXJjaGFzZSBmcm9tIFNvc2hrYSBTdG9yZSFcXG5cXG5PcmRlciBOdW1iZXI6ICR7ZGlzcGxheU9yZGVySWR9XFxuVG90YWwgQW1vdW50OiAke2Zvcm1hdElOUihvcmRlci50b3RhbCl9XFxuXFxuVGhhbmsgeW91IGZvciBzaG9wcGluZyB3aXRoIHVzIWAsXHJcbiAgICAgIGh0bWw6IGh0bWxDb250ZW50LFxyXG4gICAgICBoZWFkZXJzOiB7XHJcbiAgICAgICAgXCJYLUF1dG8tUmVzcG9uc2UtU3VwcHJlc3NcIjogXCJBbGxcIixcclxuICAgICAgICBcIlByZWNlZGVuY2VcIjogXCJidWxrXCJcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAvLyBTZW5kIHRoZSBlbWFpbFxyXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xyXG5cclxuICAgIC8vIFNpbXVsYXRlIFdoYXRzQXBwIGJhY2tlbmQgbm90aWZpY2F0aW9uIGxvZ2dpbmdcclxuICAgIGNvbnNvbGUubG9nKGBbV2hhdHNBcHAgTm90aWZpY2F0aW9uIFF1ZXVlZF0gTWVzc2FnZTogXCJEZWFyICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ubmFtZX0sIHlvdXIgU1x1MDBGNXNoa2Egb3JkZXIgIyR7b3JkZXIuaWQuc2xpY2UoMCwgOCl9IG9mICR7Zm9ybWF0SU5SKG9yZGVyLnRvdGFsKX0gaXMgY29uZmlybWVkLlwiIHNlbnQgdG8gJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5waG9uZX1gKTtcclxuXHJcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgMjAwLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdFbWFpbCBpbnZvaWNlIHNlbnQgc3VjY2Vzc2Z1bGx5JyB9KTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyBvcmRlciBjb25maXJtYXRpb24gZW1haWw6JywgZXJyb3IpO1xyXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDUwMCwgeyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIHNlbmQgZW1haWwgY29uZmlybWF0aW9uJyB9KTtcclxuICB9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFzVixTQUFTLGNBQWMsZUFBZTtBQUM1WCxPQUFPLFdBQVc7OztBQ0RvVixPQUFPLGNBQWM7QUFDM1gsT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBRWpCLFNBQVMsa0JBQWtCO0FBQ3pCLE1BQUk7QUFDRixVQUFNLFVBQVUsS0FBSyxLQUFLLFFBQVEsSUFBSSxHQUFHLE1BQU07QUFDL0MsUUFBSSxHQUFHLFdBQVcsT0FBTyxHQUFHO0FBQzFCLFlBQU0sVUFBVSxHQUFHLGFBQWEsU0FBUyxNQUFNO0FBQy9DLFlBQU0sUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNoQyxpQkFBVyxRQUFRLE9BQU87QUFDeEIsY0FBTSxVQUFVLEtBQUssS0FBSztBQUMxQixZQUFJLFdBQVcsQ0FBQyxRQUFRLFdBQVcsR0FBRyxHQUFHO0FBQ3ZDLGdCQUFNLGFBQWEsUUFBUSxRQUFRLEdBQUc7QUFDdEMsY0FBSSxlQUFlLElBQUk7QUFDckIsa0JBQU0sTUFBTSxRQUFRLE1BQU0sR0FBRyxVQUFVLEVBQUUsS0FBSztBQUM5QyxrQkFBTSxNQUFNLFFBQVEsTUFBTSxhQUFhLENBQUMsRUFBRSxLQUFLO0FBQy9DLG9C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QUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQXFNaUIsY0FBYztBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQUlkLElBQUksS0FBSyxNQUFNLGNBQWMsS0FBSyxJQUFJLENBQUMsRUFBRSxlQUFlLFNBQVMsRUFBRSxVQUFVLGVBQWUsQ0FBQyxDQUFDO0FBQUE7QUFBQTtBQUFBO0FBQUEseUVBSTlELE1BQU0sY0FBYyxrQkFBa0I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFB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U0FBUyxNQUFNLEdBQUc7QUFDdkIsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLE9BQU8sR0FBRztBQUN4Qix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDeEQsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgInBhdGgiLCAibG9hZEVudkZhbGxiYWNrIiwgInBhdGgiLCAiZnMiLCAiZ2V0UmVxdWVzdEJvZHkiLCAic2VuZFJlc3BvbnNlIiwgImhhbmRsZXIiLCAiZnMiLCAicGF0aCIsICJsb2FkRW52RmFsbGJhY2siLCAicGF0aCIsICJmcyIsICJnZXRSZXF1ZXN0Qm9keSIsICJzZW5kUmVzcG9uc2UiLCAiaGFuZGxlciIsICJmcyIsICJwYXRoIiwgImxvYWRFbnZGYWxsYmFjayIsICJwYXRoIiwgImZzIiwgImdldFJlcXVlc3RCb2R5IiwgInNlbmRSZXNwb25zZSIsICJoYW5kbGVyIiwgIm5vZGVtYWlsZXIiLCAiZnMiLCAicGF0aCIsICJsb2FkRW52RmFsbGJhY2siLCAicGF0aCIsICJmcyIsICJnZXRSZXF1ZXN0Qm9keSIsICJzZW5kUmVzcG9uc2UiLCAiaGFuZGxlciIsICJDbGllbnQiLCAibm9kZW1haWxlciIsICJoYW5kbGVyIl0KfQo=
