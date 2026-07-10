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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiLCAiYXBpL2NyZWF0ZS1vcmRlci5qcyIsICJhcGkvdmVyaWZ5LXBheW1lbnQuanMiLCAiYXBpL2NvbnRhY3QuanMiLCAiYXBpL3NoaXByb2NrZXQtcGlja3VwLmpzIiwgImFwaS9zZW5kLW9yZGVyLWNvbmZpcm1hdGlvbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rvd25sb2Fkcy9Tb3Noa2EvU29zaGthL2Vjb21tZXJjZS1hcHAvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuaW1wb3J0IGNyZWF0ZU9yZGVySGFuZGxlciBmcm9tICcuL2FwaS9jcmVhdGUtb3JkZXIuanMnXG5pbXBvcnQgdmVyaWZ5UGF5bWVudEhhbmRsZXIgZnJvbSAnLi9hcGkvdmVyaWZ5LXBheW1lbnQuanMnXG5pbXBvcnQgY29udGFjdEhhbmRsZXIgZnJvbSAnLi9hcGkvY29udGFjdC5qcydcbmltcG9ydCBzaGlwcm9ja2V0UGlja3VwSGFuZGxlciBmcm9tICcuL2FwaS9zaGlwcm9ja2V0LXBpY2t1cC5qcydcbmltcG9ydCBzZW5kT3JkZXJDb25maXJtYXRpb25IYW5kbGVyIGZyb20gJy4vYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uLmpzJ1xuXG4vLyBUcmlnZ2VyIGRldiBzZXJ2ZXIgbWlkZGxld2FyZSByZWxvYWQgdG8gcmVmcmVzaCBFUyBtb2R1bGVzIChlbWFpbCBmYWxsYmFjayBwcmlvcml0aXphdGlvbiB1cGRhdGUpXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMb2FkIGVudiB2YXJpYWJsZXNcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG5cbiAgLy8gUG9wdWxhdGUgcHJvY2Vzcy5lbnYgc28gYmFja2VuZCBmdW5jdGlvbnMgY2FuIGFjY2VzcyBjcmVkZW50aWFsc1xuICBwcm9jZXNzLmVudi5SQVpPUlBBWV9LRVlfSUQgPSBlbnYuUkFaT1JQQVlfS0VZX0lEO1xuICBwcm9jZXNzLmVudi5SQVpPUlBBWV9LRVlfU0VDUkVUID0gZW52LlJBWk9SUEFZX0tFWV9TRUNSRVQ7XG4gIHByb2Nlc3MuZW52LlNNVFBfSE9TVCA9IGVudi5TTVRQX0hPU1Q7XG4gIHByb2Nlc3MuZW52LlNNVFBfUE9SVCA9IGVudi5TTVRQX1BPUlQ7XG4gIHByb2Nlc3MuZW52LlNNVFBfVVNFUiA9IGVudi5TTVRQX1VTRVI7XG4gIHByb2Nlc3MuZW52LlNNVFBfUEFTUyA9IGVudi5TTVRQX1BBU1M7XG4gIHByb2Nlc3MuZW52LlNNVFBfVE8gPSBlbnYuU01UUF9UTztcbiAgcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9FTUFJTCA9IGVudi5TSElQUk9DS0VUX0VNQUlMO1xuICBwcm9jZXNzLmVudi5TSElQUk9DS0VUX1BBU1NXT1JEID0gZW52LlNISVBST0NLRVRfUEFTU1dPUkQ7XG4gIHByb2Nlc3MuZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OID0gZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OO1xuICBwcm9jZXNzLmVudi5TSElQUk9DS0VUX0NIQU5ORUxfSUQgPSBlbnYuU0hJUFJPQ0tFVF9DSEFOTkVMX0lEO1xuXG4gIHJldHVybiB7XG4gICAgcGx1Z2luczogW1xuICAgICAgcmVhY3QoKSxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogJ2N1c3RvbS1hcGktbWlkZGxld2FyZScsXG4gICAgICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXIpIHtcbiAgICAgICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKGFzeW5jIChyZXEsIHJlcywgbmV4dCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coYFtEZXYgU2VydmVyIE1pZGRsZXdhcmVdIEluY29taW5nIHJlcXVlc3Q6ICR7cmVxLm1ldGhvZH0gJHtyZXEudXJsfWApO1xuICAgICAgICAgICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL2FwaS9jcmVhdGUtb3JkZXInKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IGNyZWF0ZU9yZGVySGFuZGxlcihyZXEsIHJlcyk7XG4gICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgIHJlcy53cml0ZUhlYWQoNTAwLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gICAgICAgICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlcnIubWVzc2FnZSB9KSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHJlcS51cmwuc3RhcnRzV2l0aCgnL2FwaS92ZXJpZnktcGF5bWVudCcpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgdmVyaWZ5UGF5bWVudEhhbmRsZXIocmVxLCByZXMpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvY29udGFjdCcpKSB7XG4gICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYXdhaXQgY29udGFjdEhhbmRsZXIocmVxLCByZXMpO1xuICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICByZXMud3JpdGVIZWFkKDUwMCwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICAgICAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZXJyLm1lc3NhZ2UgfSkpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChyZXEudXJsLnN0YXJ0c1dpdGgoJy9hcGkvc2hpcHJvY2tldC1waWNrdXAnKSkge1xuICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGF3YWl0IHNoaXByb2NrZXRQaWNrdXBIYW5kbGVyKHJlcSwgcmVzKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocmVxLnVybC5zdGFydHNXaXRoKCcvYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uJykpIHtcbiAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBhd2FpdCBzZW5kT3JkZXJDb25maXJtYXRpb25IYW5kbGVyKHJlcSwgcmVzKTtcbiAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgcmVzLndyaXRlSGVhZCg1MDAsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgICAgICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGVyci5tZXNzYWdlIH0pKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICBdLFxuICAgIHNlcnZlcjoge1xuICAgICAgcG9ydDogMzAwMCxcbiAgICAgIHN0cmljdFBvcnQ6IHRydWUsXG4gICAgICBvcGVuOiB0cnVlLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnWC1GcmFtZS1PcHRpb25zJzogJ0RFTlknLFxuICAgICAgICAnWC1Db250ZW50LVR5cGUtT3B0aW9ucyc6ICdub3NuaWZmJyxcbiAgICAgICAgJ1JlZmVycmVyLVBvbGljeSc6ICdzdHJpY3Qtb3JpZ2luLXdoZW4tY3Jvc3Mtb3JpZ2luJyxcbiAgICAgICAgJ1gtWFNTLVByb3RlY3Rpb24nOiAnMTsgbW9kZT1ibG9jaycsXG4gICAgICAgICdDb250ZW50LVNlY3VyaXR5LVBvbGljeSc6IFwiZGVmYXVsdC1zcmMgJ3NlbGYnOyBzY3JpcHQtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgJ3Vuc2FmZS1ldmFsJyBodHRwczovL2NoZWNrb3V0LnJhem9ycGF5LmNvbTsgc3R5bGUtc3JjICdzZWxmJyAndW5zYWZlLWlubGluZScgaHR0cHM6Ly9mb250cy5nb29nbGVhcGlzLmNvbTsgaW1nLXNyYyAnc2VsZicgZGF0YTogaHR0cHM6OyBmb250LXNyYyAnc2VsZicgZGF0YTogaHR0cHM6Ly9mb250cy5nc3RhdGljLmNvbTsgY29ubmVjdC1zcmMgJ3NlbGYnIGh0dHBzOi8vYm1iZWdqeGZrcHllbm5kZmJjZGouc3VwYWJhc2UuY28gd3NzOi8vYm1iZWdqeGZrcHllbm5kZmJjZGouc3VwYWJhc2UuY28gaHR0cHM6Ly9hcGkucmF6b3JwYXkuY29tOyBmcmFtZS1zcmMgJ3NlbGYnIGh0dHBzOi8vYXBpLnJhem9ycGF5LmNvbSBodHRwczovL2NoZWNrb3V0LnJhem9ycGF5LmNvbTtcIixcbiAgICAgICAgJ1Blcm1pc3Npb25zLVBvbGljeSc6ICdjYW1lcmE9KCksIG1pY3JvcGhvbmU9KCksIGdlb2xvY2F0aW9uPSgpLCBpbnRlcmVzdC1jb2hvcnQ9KCknXG4gICAgICB9XG4gICAgfSxcbiAgICBidWlsZDoge1xuICAgICAgc291cmNlbWFwOiBmYWxzZSxcbiAgICAgIG1pbmlmeTogJ2VzYnVpbGQnLFxuICAgICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLFxuICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICBvdXRwdXQ6IHtcbiAgICAgICAgICBtYW51YWxDaHVua3MoaWQpIHtcbiAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbm9kZV9tb2R1bGVzJykpIHtcbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCd0aHJlZScpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItdGhyZWUnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnZ3NhcCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItZ3NhcCc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKCdsZW5pcycpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItbGVuaXMnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnQHN1cGFiYXNlJykgfHwgaWQuaW5jbHVkZXMoJ3dlYnNvY2tldCcpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3Itc3VwYWJhc2UnO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmIChpZC5pbmNsdWRlcygnbHVjaWRlLXJlYWN0JykpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ3ZlbmRvci1pY29ucyc7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgcmV0dXJuICd2ZW5kb3ItY29yZSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9O1xufSlcbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXGNyZWF0ZS1vcmRlci5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWJkdWwvRG93bmxvYWRzL1Nvc2hrYS9Tb3Noa2EvZWNvbW1lcmNlLWFwcC9hcGkvY3JlYXRlLW9yZGVyLmpzXCI7aW1wb3J0IFJhem9ycGF5IGZyb20gJ3Jhem9ycGF5JztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuZnVuY3Rpb24gbG9hZEVudkZhbGxiYWNrKCkge1xuICB0cnkge1xuICAgIGNvbnN0IGVudlBhdGggPSBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJy5lbnYnKTtcbiAgICBpZiAoZnMuZXhpc3RzU3luYyhlbnZQYXRoKSkge1xuICAgICAgY29uc3QgY29udGVudCA9IGZzLnJlYWRGaWxlU3luYyhlbnZQYXRoLCAndXRmOCcpO1xuICAgICAgY29uc3QgbGluZXMgPSBjb250ZW50LnNwbGl0KCdcXG4nKTtcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBsaW5lcykge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICh0cmltbWVkICYmICF0cmltbWVkLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgICAgIGNvbnN0IGZpcnN0RXF1YWwgPSB0cmltbWVkLmluZGV4T2YoJz0nKTtcbiAgICAgICAgICBpZiAoZmlyc3RFcXVhbCAhPT0gLTEpIHtcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHRyaW1tZWQuc2xpY2UoMCwgZmlyc3RFcXVhbCkudHJpbSgpO1xuICAgICAgICAgICAgY29uc3QgdmFsID0gdHJpbW1lZC5zbGljZShmaXJzdEVxdWFsICsgMSkudHJpbSgpO1xuICAgICAgICAgICAgcHJvY2Vzcy5lbnZba2V5XSA9IHZhbDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2ggKGVycikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGxvYWRpbmcgZmFsbGJhY2sgLmVudjonLCBlcnIpO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldFJlcXVlc3RCb2R5KHJlcSkge1xuICBpZiAocmVxLmJvZHkpIHtcbiAgICByZXR1cm4gdHlwZW9mIHJlcS5ib2R5ID09PSAnc3RyaW5nJyA/IEpTT04ucGFyc2UocmVxLmJvZHkpIDogcmVxLmJvZHk7XG4gIH1cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBsZXQgYm9keSA9ICcnO1xuICAgIHJlcS5vbignZGF0YScsIGNodW5rID0+IHtcbiAgICAgIGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTtcbiAgICB9KTtcbiAgICByZXEub24oJ2VuZCcsICgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJlc29sdmUoYm9keSA/IEpTT04ucGFyc2UoYm9keSkgOiB7fSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlcnJvcicsIGVyciA9PiByZWplY3QoZXJyKSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBzZW5kUmVzcG9uc2UocmVzLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oZGF0YSk7XG4gIH1cbiAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBhc3luYyBmdW5jdGlvbiBoYW5kbGVyKHJlcSwgcmVzKSB7XG4gIC8vIEFsbG93IG9ubHkgUE9TVCByZXF1ZXN0c1xuICBpZiAocmVxLm1ldGhvZCAhPT0gJ1BPU1QnKSB7XG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwNSwgeyBlcnJvcjogJ01ldGhvZCBub3QgYWxsb3dlZCcgfSk7XG4gIH1cblxuICBsb2FkRW52RmFsbGJhY2soKTtcblxuICBjb25zdCBrZXlJZCA9IHByb2Nlc3MuZW52LlJBWk9SUEFZX0tFWV9JRDtcbiAgY29uc3Qga2V5U2VjcmV0ID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcblxuICBpZiAoIWtleUlkIHx8ICFrZXlTZWNyZXQpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAxLCB7IGVycm9yOiAnUmF6b3JwYXkga2V5cyBub3QgY29uZmlndXJlZCcgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBnZXRSZXF1ZXN0Qm9keShyZXEpO1xuICAgIGNvbnN0IHsgYW1vdW50LCBjdXJyZW5jeSA9ICdJTlInLCByZWNlaXB0IH0gPSBib2R5O1xuXG4gICAgY29uc3QgYW1vdW50SW50ID0gcGFyc2VJbnQoYW1vdW50LCAxMCk7XG4gICAgaWYgKGlzTmFOKGFtb3VudEludCkgfHwgYW1vdW50SW50IDwgMTAwKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnQW1vdW50IG11c3QgYmUgYXQgbGVhc3QgMTAwIHBhaXNlJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCByYXpvcnBheSA9IG5ldyBSYXpvcnBheSh7XG4gICAgICBrZXlfaWQ6IGtleUlkLFxuICAgICAga2V5X3NlY3JldDoga2V5U2VjcmV0LFxuICAgIH0pO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgIGFtb3VudDogYW1vdW50SW50LFxuICAgICAgY3VycmVuY3ksXG4gICAgICByZWNlaXB0OiByZWNlaXB0IHx8IGByZWNlaXB0XyR7RGF0ZS5ub3coKX1gLFxuICAgIH07XG5cbiAgICBjb25zdCBvcmRlciA9IGF3YWl0IHJhem9ycGF5Lm9yZGVycy5jcmVhdGUob3B0aW9ucyk7XG5cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgMjAwLCB7XG4gICAgICBvcmRlcl9pZDogb3JkZXIuaWQsXG4gICAgICBhbW91bnQ6IG9yZGVyLmFtb3VudCxcbiAgICAgIGN1cnJlbmN5OiBvcmRlci5jdXJyZW5jeSxcbiAgICB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjcmVhdGluZyBSYXpvcnBheSBvcmRlcjonLCBlcnJvcik7XG4gICAgLy8gSGFuZGxlIGF1dGggZmFpbHVyZXMgc3BlY2lmaWNhbGx5IGlmIHBvc3NpYmxlLCBvciBnZW5lcmFsIDUwMCBlcnJvclxuICAgIGlmIChlcnJvci5zdGF0dXNDb2RlID09PSA0MDEpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDEsIHsgZXJyb3I6ICdSYXpvcnBheSBhdXRoZW50aWNhdGlvbiBmYWlsZWQnIH0pO1xuICAgIH1cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNTAwLCB7IGVycm9yOiBlcnJvci5tZXNzYWdlIHx8ICdJbnRlcm5hbCBzZXJ2ZXIgZXJyb3InIH0pO1xuICB9XG59XG4iLCAiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEb3dubG9hZHNcXFxcU29zaGthXFxcXFNvc2hrYVxcXFxlY29tbWVyY2UtYXBwXFxcXGFwaVxcXFx2ZXJpZnktcGF5bWVudC5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvYWJkdWwvRG93bmxvYWRzL1Nvc2hrYS9Tb3Noa2EvZWNvbW1lcmNlLWFwcC9hcGkvdmVyaWZ5LXBheW1lbnQuanNcIjtpbXBvcnQgY3J5cHRvIGZyb20gJ2NyeXB0byc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gc2VuZFJlc3BvbnNlKHJlcywgc3RhdHVzQ29kZSwgZGF0YSkge1xuICBpZiAodHlwZW9mIHJlcy5zdGF0dXMgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gcmVzLnN0YXR1cyhzdGF0dXNDb2RlKS5qc29uKGRhdGEpO1xuICB9XG4gIHJlcy53cml0ZUhlYWQoc3RhdHVzQ29kZSwgeyAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nIH0pO1xuICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xuICAvLyBBbGxvdyBvbmx5IFBPU1QgcmVxdWVzdHNcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDUsIHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xuICB9XG5cbiAgbG9hZEVudkZhbGxiYWNrKCk7XG5cbiAgY29uc3Qga2V5U2VjcmV0ID0gcHJvY2Vzcy5lbnYuUkFaT1JQQVlfS0VZX1NFQ1JFVDtcblxuICBpZiAoIWtleVNlY3JldCkge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6ICdSYXpvcnBheSBzZWNyZXQga2V5IG5vdCBjb25maWd1cmVkJyB9KTtcbiAgfVxuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IGdldFJlcXVlc3RCb2R5KHJlcSk7XG4gICAgY29uc3QgeyBvcmRlcl9pZCwgcGF5bWVudF9pZCwgc2lnbmF0dXJlIH0gPSBib2R5O1xuXG4gICAgLy8gVmFsaWRhdGUgcHJlc2VuY2Ugb2YgcmVxdWlyZWQgZmllbGRzXG4gICAgaWYgKCFvcmRlcl9pZCB8fCAhcGF5bWVudF9pZCB8fCAhc2lnbmF0dXJlKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnTWlzc2luZyByZXF1aXJlZCBzaWduYXR1cmUgdmVyaWZpY2F0aW9uIGZpZWxkcycgfSk7XG4gICAgfVxuXG4gICAgLy8gR2VuZXJhdGUgZXhwZWN0ZWQgc2lnbmF0dXJlXG4gICAgY29uc3QgdGV4dCA9IG9yZGVyX2lkICsgJ3wnICsgcGF5bWVudF9pZDtcbiAgICBjb25zdCBnZW5lcmF0ZWRTaWduYXR1cmUgPSBjcnlwdG9cbiAgICAgIC5jcmVhdGVIbWFjKCdzaGEyNTYnLCBrZXlTZWNyZXQpXG4gICAgICAudXBkYXRlKHRleHQpXG4gICAgICAuZGlnZXN0KCdoZXgnKTtcblxuICAgIC8vIENvbXBhcmUgc2lnbmF0dXJlc1xuICAgIGlmIChnZW5lcmF0ZWRTaWduYXR1cmUgPT09IHNpZ25hdHVyZSkge1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwgeyBzdGF0dXM6ICdvaycsIHZlcmlmaWVkOiB0cnVlIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1Jhem9ycGF5IHNpZ25hdHVyZSBtaXNtYXRjaCcpO1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwgeyBzdGF0dXM6ICdmYWlsZWQnLCBlcnJvcjogJ1BheW1lbnQgc2lnbmF0dXJlIG1pc21hdGNoJyB9KTtcbiAgICB9XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgdmVyaWZ5aW5nIFJhem9ycGF5IHBheW1lbnQ6JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ludGVybmFsIHNlcnZlciBlcnJvcicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXGNvbnRhY3QuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rvd25sb2Fkcy9Tb3Noa2EvU29zaGthL2Vjb21tZXJjZS1hcHAvYXBpL2NvbnRhY3QuanNcIjtpbXBvcnQgbm9kZW1haWxlciBmcm9tICdub2RlbWFpbGVyJztcbmltcG9ydCBmcyBmcm9tICdmcyc7XG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcblxuLy8gSGVscGVyIHRvIGxvYWQgZmFsbGJhY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzIGxvY2FsbHlcbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG4vLyBIZWxwZXIgdG8gcGFyc2UgcmVxdWVzdCBib2R5XG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuLy8gSGVscGVyIHRvIHNlbmQgSlNPTiByZXNwb25zZXNcbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShyZXMsIHN0YXR1c0NvZGUsIGRhdGEpIHtcbiAgaWYgKHR5cGVvZiByZXMuc3RhdHVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoc3RhdHVzQ29kZSkuanNvbihkYXRhKTtcbiAgfVxuICByZXMud3JpdGVIZWFkKHN0YXR1c0NvZGUsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcbiAgLy8gQWxsb3cgb25seSBQT1NUIHJlcXVlc3RzXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDA1LCB7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcbiAgfVxuXG4gIGxvYWRFbnZGYWxsYmFjaygpO1xuXG4gIHRyeSB7XG4gICAgY29uc3QgYm9keSA9IGF3YWl0IGdldFJlcXVlc3RCb2R5KHJlcSk7XG4gICAgY29uc3QgeyBuYW1lLCBlbWFpbCwgbWVzc2FnZSB9ID0gYm9keTtcblxuICAgIGlmICghbmFtZSB8fCAhZW1haWwgfHwgIW1lc3NhZ2UpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHsgZXJyb3I6ICdOYW1lLCBlbWFpbCwgYW5kIG1lc3NhZ2UgYXJlIHJlcXVpcmVkIGZpZWxkcycgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LlNNVFBfSE9TVDtcbiAgICBjb25zdCBwb3J0ID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuU01UUF9QT1JUIHx8ICc1ODcnLCAxMCk7XG4gICAgY29uc3QgdXNlciA9IHByb2Nlc3MuZW52LlNNVFBfVVNFUjtcbiAgICBjb25zdCBwYXNzID0gcHJvY2Vzcy5lbnYuU01UUF9QQVNTO1xuICAgIGNvbnN0IHRvID0gcHJvY2Vzcy5lbnYuU01UUF9UTyB8fCAnc29zaGthLmluQGdtYWlsLmNvbSc7XG5cbiAgICAvLyBWZXJpZnkgU01UUCBzZXR0aW5ncyBhcmUgY29uZmlndXJlZCBhbmQgbm90IHBsYWNlaG9sZGVyc1xuICAgIGlmICghaG9zdCB8fCAhdXNlciB8fCAhcGFzcyB8fCBwYXNzID09PSAneW91ci1nbWFpbC1hcHAtcGFzc3dvcmQnKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ1NNVFAgY29uZmlndXJhdGlvbiBpcyBtaXNzaW5nIG9yIHVzaW5nIGRlZmF1bHQgcGxhY2Vob2xkZXJzLicpO1xuICAgICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDQwMCwge1xuICAgICAgICBlcnJvcjogJ1NNVFAgY3JlZGVudGlhbHMgYXJlIG5vdCBmdWxseSBjb25maWd1cmVkIGluIHlvdXIgZW52aXJvbm1lbnQuIFBsZWFzZSB1cGRhdGUgU01UUF9QQVNTIGluIHRoZSAuZW52IGZpbGUuJ1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbm9kZW1haWxlciB0cmFuc3BvcnRlclxuICAgIGNvbnN0IHRyYW5zcG9ydGVyID0gbm9kZW1haWxlci5jcmVhdGVUcmFuc3BvcnQoe1xuICAgICAgaG9zdCxcbiAgICAgIHBvcnQsXG4gICAgICBzZWN1cmU6IHBvcnQgPT09IDQ2NSwgLy8gdHJ1ZSBmb3IgNDY1LCBmYWxzZSBmb3Igb3RoZXIgcG9ydHNcbiAgICAgIGF1dGg6IHtcbiAgICAgICAgdXNlcixcbiAgICAgICAgcGFzcyxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgYSBiZWF1dGlmdWwgSFRNTCBib2R5XG4gICAgY29uc3QgaHRtbENvbnRlbnQgPSBgXG4gICAgICA8ZGl2IHN0eWxlPVwiZm9udC1mYW1pbHk6IEFyaWFsLCBzYW5zLXNlcmlmOyBtYXgtd2lkdGg6IDYwMHB4OyBtYXJnaW46IDAgYXV0bzsgcGFkZGluZzogMjBweDsgYm9yZGVyOiAxcHggc29saWQgI2UyZThmMDsgYm9yZGVyLXJhZGl1czogOHB4O1wiPlxuICAgICAgICA8aDIgc3R5bGU9XCJjb2xvcjogIzRmNDZlNTsgYm9yZGVyLWJvdHRvbTogMnB4IHNvbGlkICNlMmU4ZjA7IHBhZGRpbmctYm90dG9tOiAxMHB4OyBtYXJnaW4tdG9wOiAwO1wiPk5ldyBDb250YWN0IEZvcm0gSW5xdWlyeTwvaDI+XG4gICAgICAgIDxwIHN0eWxlPVwiZm9udC1zaXplOiAxNnB4OyBsaW5lLWhlaWdodDogMS41OyBjb2xvcjogIzFlMjkzYjtcIj5cbiAgICAgICAgICBZb3UgaGF2ZSByZWNlaXZlZCBhIG5ldyBjb250YWN0IHN1Ym1pc3Npb24gZnJvbSB5b3VyIHN0b3JlIHdlYnNpdGUuXG4gICAgICAgIDwvcD5cbiAgICAgICAgPHRhYmxlIHN0eWxlPVwid2lkdGg6IDEwMCU7IGJvcmRlci1jb2xsYXBzZTogY29sbGFwc2U7IG1hcmdpbi10b3A6IDIwcHg7XCI+XG4gICAgICAgICAgPHRyPlxuICAgICAgICAgICAgPHRkIHN0eWxlPVwicGFkZGluZzogOHB4IDA7IGZvbnQtd2VpZ2h0OiBib2xkOyBjb2xvcjogIzQ3NTU2OTsgd2lkdGg6IDEyMHB4O1wiPk5hbWU6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTtcIj4ke25hbWV9PC90ZD5cbiAgICAgICAgICA8L3RyPlxuICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBmb250LXdlaWdodDogYm9sZDsgY29sb3I6ICM0NzU1Njk7XCI+RW1haWw6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTtcIj5cbiAgICAgICAgICAgICAgPGEgaHJlZj1cIm1haWx0bzoke2VtYWlsfVwiIHN0eWxlPVwiY29sb3I6ICM0ZjQ2ZTU7IHRleHQtZGVjb3JhdGlvbjogbm9uZTtcIj4ke2VtYWlsfTwvYT5cbiAgICAgICAgICAgIDwvdGQ+XG4gICAgICAgICAgPC90cj5cbiAgICAgICAgICA8dHI+XG4gICAgICAgICAgICA8dGQgc3R5bGU9XCJwYWRkaW5nOiA4cHggMDsgZm9udC13ZWlnaHQ6IGJvbGQ7IGNvbG9yOiAjNDc1NTY5OyB2ZXJ0aWNhbC1hbGlnbjogdG9wO1wiPk1lc3NhZ2U6PC90ZD5cbiAgICAgICAgICAgIDx0ZCBzdHlsZT1cInBhZGRpbmc6IDhweCAwOyBjb2xvcjogIzBmMTcyYTsgd2hpdGUtc3BhY2U6IHByZS13cmFwOyBsaW5lLWhlaWdodDogMS41O1wiPiR7bWVzc2FnZX08L3RkPlxuICAgICAgICAgIDwvdHI+XG4gICAgICAgIDwvdGFibGU+XG4gICAgICAgIDxkaXYgc3R5bGU9XCJtYXJnaW4tdG9wOiAzMHB4OyBwYWRkaW5nLXRvcDogMTVweDsgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlMmU4ZjA7IGZvbnQtc2l6ZTogMTJweDsgY29sb3I6ICM5NGEzYjg7IHRleHQtYWxpZ246IGNlbnRlcjtcIj5cbiAgICAgICAgICBTZW50IGF1dG9tYXRpY2FsbHkgZnJvbSBTb3Noa2EgU3RvcmUgQ29udGFjdCBmb3JtLlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIGA7XG5cbiAgICAvLyBEZWZpbmUgbWFpbCBvcHRpb25zXG4gICAgY29uc3QgbWFpbE9wdGlvbnMgPSB7XG4gICAgICBmcm9tOiBgXCIke25hbWV9IChTb3Noa2EgU3RvcmUgQ29udGFjdClcIiA8JHt1c2VyfT5gLFxuICAgICAgcmVwbHlUbzogZW1haWwsXG4gICAgICB0byxcbiAgICAgIHN1YmplY3Q6IGBbU29zaGthIFN0b3JlXSBDb250YWN0IFJlcXVlc3QgZnJvbSAke25hbWV9YCxcbiAgICAgIHRleHQ6IGBOZXcgQ29udGFjdCBSZXF1ZXN0XFxuXFxuTmFtZTogJHtuYW1lfVxcbkVtYWlsOiAke2VtYWlsfVxcbk1lc3NhZ2U6ICR7bWVzc2FnZX1gLFxuICAgICAgaHRtbDogaHRtbENvbnRlbnQsXG4gICAgfTtcblxuICAgIC8vIFNlbmQgdGhlIGVtYWlsXG4gICAgYXdhaXQgdHJhbnNwb3J0ZXIuc2VuZE1haWwobWFpbE9wdGlvbnMpO1xuXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwgeyBzdWNjZXNzOiB0cnVlLCBtZXNzYWdlOiAnRW1haWwgc2VudCBzdWNjZXNzZnVsbHknIH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgZW1haWw6JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ZhaWxlZCB0byBzZW5kIGVtYWlsIG5vdGlmaWNhdGlvbicgfSk7XG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGFiZHVsXFxcXERvd25sb2Fkc1xcXFxTb3Noa2FcXFxcU29zaGthXFxcXGVjb21tZXJjZS1hcHBcXFxcYXBpXFxcXHNoaXByb2NrZXQtcGlja3VwLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hYmR1bC9Eb3dubG9hZHMvU29zaGthL1Nvc2hrYS9lY29tbWVyY2UtYXBwL2FwaS9zaGlwcm9ja2V0LXBpY2t1cC5qc1wiO2ltcG9ydCBwZyBmcm9tICdwZyc7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbmNvbnN0IHsgQ2xpZW50IH0gPSBwZztcblxuLy8gSGVscGVyIHRvIGxvYWQgZmFsbGJhY2sgZW52aXJvbm1lbnQgdmFyaWFibGVzIGxvY2FsbHlcbmZ1bmN0aW9uIGxvYWRFbnZGYWxsYmFjaygpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBlbnZQYXRoID0gcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksICcuZW52Jyk7XG4gICAgaWYgKGZzLmV4aXN0c1N5bmMoZW52UGF0aCkpIHtcbiAgICAgIGNvbnN0IGNvbnRlbnQgPSBmcy5yZWFkRmlsZVN5bmMoZW52UGF0aCwgJ3V0ZjgnKTtcbiAgICAgIGNvbnN0IGxpbmVzID0gY29udGVudC5zcGxpdCgnXFxuJyk7XG4gICAgICBmb3IgKGNvbnN0IGxpbmUgb2YgbGluZXMpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAodHJpbW1lZCAmJiAhdHJpbW1lZC5zdGFydHNXaXRoKCcjJykpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdEVxdWFsID0gdHJpbW1lZC5pbmRleE9mKCc9Jyk7XG4gICAgICAgICAgaWYgKGZpcnN0RXF1YWwgIT09IC0xKSB7XG4gICAgICAgICAgICBjb25zdCBrZXkgPSB0cmltbWVkLnNsaWNlKDAsIGZpcnN0RXF1YWwpLnRyaW0oKTtcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHRyaW1tZWQuc2xpY2UoZmlyc3RFcXVhbCArIDEpLnRyaW0oKTtcbiAgICAgICAgICAgIHByb2Nlc3MuZW52W2tleV0gPSB2YWw7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGNhdGNoIChlcnIpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBsb2FkaW5nIGZhbGxiYWNrIC5lbnY6JywgZXJyKTtcbiAgfVxufVxuXG4vLyBIZWxwZXIgdG8gcGFyc2UgcmVxdWVzdCBib2R5XG5hc3luYyBmdW5jdGlvbiBnZXRSZXF1ZXN0Qm9keShyZXEpIHtcbiAgaWYgKHJlcS5ib2R5KSB7XG4gICAgcmV0dXJuIHR5cGVvZiByZXEuYm9keSA9PT0gJ3N0cmluZycgPyBKU09OLnBhcnNlKHJlcS5ib2R5KSA6IHJlcS5ib2R5O1xuICB9XG4gIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgbGV0IGJvZHkgPSAnJztcbiAgICByZXEub24oJ2RhdGEnLCBjaHVuayA9PiB7XG4gICAgICBib2R5ICs9IGNodW5rLnRvU3RyaW5nKCk7XG4gICAgfSk7XG4gICAgcmVxLm9uKCdlbmQnLCAoKSA9PiB7XG4gICAgICB0cnkge1xuICAgICAgICByZXNvbHZlKGJvZHkgPyBKU09OLnBhcnNlKGJvZHkpIDoge30pO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJlcS5vbignZXJyb3InLCBlcnIgPT4gcmVqZWN0KGVycikpO1xuICB9KTtcbn1cblxuLy8gSGVscGVyIHRvIHNlbmQgSlNPTiByZXNwb25zZXNcbmZ1bmN0aW9uIHNlbmRSZXNwb25zZShyZXMsIHN0YXR1c0NvZGUsIGRhdGEpIHtcbiAgaWYgKHR5cGVvZiByZXMuc3RhdHVzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIHJlcy5zdGF0dXMoc3RhdHVzQ29kZSkuanNvbihkYXRhKTtcbiAgfVxuICByZXMud3JpdGVIZWFkKHN0YXR1c0NvZGUsIHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9KTtcbiAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShkYXRhKSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGFzeW5jIGZ1bmN0aW9uIGhhbmRsZXIocmVxLCByZXMpIHtcbiAgLy8gQWxsb3cgb25seSBQT1NUIHJlcXVlc3RzXG4gIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHtcbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDA1LCB7IGVycm9yOiAnTWV0aG9kIG5vdCBhbGxvd2VkJyB9KTtcbiAgfVxuXG4gIGxvYWRFbnZGYWxsYmFjaygpO1xuXG4gIGNvbnN0IGVtYWlsID0gcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9FTUFJTDtcbiAgY29uc3QgcGFzc3dvcmQgPSBwcm9jZXNzLmVudi5TSElQUk9DS0VUX1BBU1NXT1JEO1xuICBjb25zdCBwaWNrdXBMb2NhdGlvbiA9IHByb2Nlc3MuZW52LlNISVBST0NLRVRfUElDS1VQX0xPQ0FUSU9OIHx8ICdQcmltYXJ5JztcbiAgY29uc3QgY2hhbm5lbElkID0gcHJvY2Vzcy5lbnYuU0hJUFJPQ0tFVF9DSEFOTkVMX0lEO1xuXG4gIGlmICghZW1haWwgfHwgIXBhc3N3b3JkIHx8IGVtYWlsID09PSAneW91ci1zaGlwcm9ja2V0LWVtYWlsQGRvbWFpbi5jb20nKSB7XG4gICAgY29uc29sZS53YXJuKCdTaGlwcm9ja2V0IGNyZWRlbnRpYWxzIGFyZSBtaXNzaW5nIG9yIGRlZmF1bHQgcGxhY2Vob2xkZXJzLicpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHtcbiAgICAgIGVycm9yOiAnU2hpcHJvY2tldCBjcmVkZW50aWFscyBhcmUgbm90IGNvbmZpZ3VyZWQuIFBsZWFzZSB1cGRhdGUgU0hJUFJPQ0tFVF9FTUFJTCBhbmQgU0hJUFJPQ0tFVF9QQVNTV09SRCBpbiB5b3VyIC5lbnYgZmlsZS4nXG4gICAgfSk7XG4gIH1cblxuICB0cnkge1xuICAgIGNvbnN0IGJvZHkgPSBhd2FpdCBnZXRSZXF1ZXN0Qm9keShyZXEpO1xuICAgIGNvbnN0IHsgb3JkZXIsIGVtYWlsOiBjdXN0b21lckVtYWlsIH0gPSBib2R5O1xuXG4gICAgaWYgKCFvcmRlciB8fCAhb3JkZXIuaWQgfHwgIW9yZGVyLnNoaXBwaW5nX2FkZHJlc3MgfHwgIW9yZGVyLml0ZW1zKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnTWlzc2luZyBvcmRlciBkZXRhaWxzJyB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHNoaXBwaW5nX2FkZHJlc3MsIGl0ZW1zLCB0b3RhbCwgaWQ6IG9yZGVyVXVpZCB9ID0gb3JkZXI7XG5cbiAgICAvLyAxLiBBdXRoZW50aWNhdGUgd2l0aCBTaGlwcm9ja2V0XG4gICAgY29uc29sZS5sb2coJ0F1dGhlbnRpY2F0aW5nIHdpdGggU2hpcHJvY2tldC4uLicpO1xuICAgIGNvbnN0IGF1dGhSZXMgPSBhd2FpdCBmZXRjaCgnaHR0cHM6Ly9hcGl2Mi5zaGlwcm9ja2V0LmluL3YxL2V4dGVybmFsL2F1dGgvbG9naW4nLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyB9LFxuICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBlbWFpbCwgcGFzc3dvcmQgfSlcbiAgICB9KTtcblxuICAgIGlmICghYXV0aFJlcy5vaykge1xuICAgICAgY29uc3QgYXV0aEVycm9yID0gYXdhaXQgYXV0aFJlcy5qc29uKCk7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYFNoaXByb2NrZXQgYXV0aCBmYWlsZWQ6ICR7YXV0aEVycm9yLm1lc3NhZ2UgfHwgYXV0aFJlcy5zdGF0dXNUZXh0fWApO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdG9rZW4gfSA9IGF3YWl0IGF1dGhSZXMuanNvbigpO1xuICAgIGNvbnNvbGUubG9nKCdTaGlwcm9ja2V0IGF1dGhlbnRpY2F0ZWQgc3VjY2Vzc2Z1bGx5LicpO1xuXG4gICAgLy8gMi4gRm9ybWF0IG9yZGVyIGRhdGVcbiAgICBjb25zdCBvcmRlckRhdGUgPSBuZXcgRGF0ZShvcmRlci5jcmVhdGVkX2F0IHx8IERhdGUubm93KCkpXG4gICAgICAudG9JU09TdHJpbmcoKVxuICAgICAgLnJlcGxhY2UoJ1QnLCAnICcpXG4gICAgICAuc2xpY2UoMCwgMTYpO1xuXG4gICAgLy8gU3BsaXQgbmFtZSBpbnRvIGZpcnN0IGFuZCBsYXN0XG4gICAgY29uc3QgbmFtZVBhcnRzID0gKHNoaXBwaW5nX2FkZHJlc3MubmFtZSB8fCAnQ3VzdG9tZXInKS50cmltKCkuc3BsaXQoL1xccysvKTtcbiAgICBjb25zdCBmaXJzdE5hbWUgPSBuYW1lUGFydHNbMF07XG4gICAgY29uc3QgbGFzdE5hbWUgPSBuYW1lUGFydHMuc2xpY2UoMSkuam9pbignICcpIHx8ICcuJztcblxuICAgIC8vIEZvcm1hdCBpdGVtc1xuICAgIGNvbnN0IG9yZGVySXRlbXMgPSBpdGVtcy5tYXAoKGl0ZW0sIGlkeCkgPT4gKHtcbiAgICAgIG5hbWU6IGl0ZW0ubmFtZSB8fCBgSmV3ZWxyeSBJdGVtICR7aWR4ICsgMX1gLFxuICAgICAgc2t1OiBpdGVtLnByb2R1Y3RfaWQgPyBpdGVtLnByb2R1Y3RfaWQuc2xpY2UoMCwgOCkgOiBgU0tVLSR7aWR4fWAsXG4gICAgICB1bml0czogcGFyc2VJbnQoaXRlbS5xdWFudGl0eSB8fCAnMScsIDEwKSxcbiAgICAgIHNlbGxpbmdfcHJpY2U6IHBhcnNlRmxvYXQoaXRlbS5wcmljZSB8fCAnMCcpXG4gICAgfSkpO1xuXG4gICAgLy8gQnVpbGQgdGhlIFNoaXByb2NrZXQgQWRob2MgT3JkZXIgcGF5bG9hZFxuICAgIGNvbnN0IHBheWxvYWQgPSB7XG4gICAgICBvcmRlcl9pZDogb3JkZXJVdWlkLnNsaWNlKDAsIDIwKSwgLy8gTWF4IDIwIGNoYXJhY3RlcnMgZm9yIHR5cGljYWwgU2hpcHJvY2tldCBJRFxuICAgICAgb3JkZXJfZGF0ZTogb3JkZXJEYXRlLFxuICAgICAgcGlja3VwX2xvY2F0aW9uOiBwaWNrdXBMb2NhdGlvbixcbiAgICAgIGNoYW5uZWxfaWQ6IGNoYW5uZWxJZCA/IHBhcnNlSW50KGNoYW5uZWxJZCwgMTApIDogdW5kZWZpbmVkLFxuICAgICAgYmlsbGluZ19jdXN0b21lcl9uYW1lOiBmaXJzdE5hbWUsXG4gICAgICBiaWxsaW5nX2xhc3RfbmFtZTogbGFzdE5hbWUsXG4gICAgICBiaWxsaW5nX2FkZHJlc3M6IHNoaXBwaW5nX2FkZHJlc3MuYWRkcmVzc0xpbmUgfHwgc2hpcHBpbmdfYWRkcmVzcy5hZGRyZXNzIHx8ICdBZGRyZXNzIExpbmUgMScsXG4gICAgICBiaWxsaW5nX2NpdHk6IHNoaXBwaW5nX2FkZHJlc3MuY2l0eSB8fCAnQ2l0eScsXG4gICAgICBiaWxsaW5nX3BpbmNvZGU6IHBhcnNlSW50KHNoaXBwaW5nX2FkZHJlc3MucG9zdGFsQ29kZSB8fCAnMTEwMDAxJywgMTApLFxuICAgICAgYmlsbGluZ19zdGF0ZTogc2hpcHBpbmdfYWRkcmVzcy5zdGF0ZSB8fCAnU3RhdGUnLFxuICAgICAgYmlsbGluZ19jb3VudHJ5OiAnSW5kaWEnLFxuICAgICAgYmlsbGluZ19lbWFpbDogY3VzdG9tZXJFbWFpbCB8fCAnY3VzdG9tZXJAc29zaGthLmluJyxcbiAgICAgIGJpbGxpbmdfcGhvbmU6IHNoaXBwaW5nX2FkZHJlc3MucGhvbmUgPyBzaGlwcGluZ19hZGRyZXNzLnBob25lLnJlcGxhY2UoL1teMC05XS9nLCAnJykgOiAnOTg3NjU0MzIxMCcsXG4gICAgICBzaGlwcGluZ19pc19iaWxsaW5nOiB0cnVlLFxuICAgICAgb3JkZXJfaXRlbXM6IG9yZGVySXRlbXMsXG4gICAgICBwYXltZW50X21ldGhvZDogJ1ByZXBhaWQnLFxuICAgICAgc3ViX3RvdGFsOiBwYXJzZUZsb2F0KHRvdGFsIHx8ICcwJyksXG4gICAgICBsZW5ndGg6IDEwLCAvLyBjbSAoZGVmYXVsdCBwYWNrYWdlIGJveCBzaXplKVxuICAgICAgYnJlYWR0aDogMTAsICAvLyBjbVxuICAgICAgaGVpZ2h0OiA1LCAgLy8gY21cbiAgICAgIHdlaWdodDogMC4yIC8vIGtnXG4gICAgfTtcblxuICAgIC8vIDMuIENyZWF0ZSB0aGUgb3JkZXIgaW4gU2hpcHJvY2tldFxuICAgIGNvbnNvbGUubG9nKCdTZW5kaW5nIG9yZGVyIHBheWxvYWQgdG8gU2hpcHJvY2tldC4uLicpO1xuICAgIGNvbnN0IGNyZWF0ZU9yZGVyUmVzID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXBpdjIuc2hpcHJvY2tldC5pbi92MS9leHRlcm5hbC9vcmRlcnMvY3JlYXRlL2FkaG9jJywge1xuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgICdBdXRob3JpemF0aW9uJzogYEJlYXJlciAke3Rva2VufWBcbiAgICAgIH0sXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeShwYXlsb2FkKVxuICAgIH0pO1xuXG4gICAgaWYgKCFjcmVhdGVPcmRlclJlcy5vaykge1xuICAgICAgY29uc3QgY3JlYXRlRXJyb3JNc2cgPSBhd2FpdCBjcmVhdGVPcmRlclJlcy50ZXh0KCk7XG4gICAgICBjb25zb2xlLmVycm9yKCdTaGlwcm9ja2V0IG9yZGVyIGNyZWF0aW9uIGVycm9yIHJlc3BvbnNlOicsIGNyZWF0ZUVycm9yTXNnKTtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBvcmRlciBjcmVhdGlvbiBmYWlsZWQ6ICR7Y3JlYXRlRXJyb3JNc2d9YCk7XG4gICAgfVxuXG4gICAgY29uc3QgY3JlYXRlRGF0YSA9IGF3YWl0IGNyZWF0ZU9yZGVyUmVzLmpzb24oKTtcbiAgICBjb25zb2xlLmxvZygnU2hpcHJvY2tldCBvcmRlciBjcmVhdGVkOicsIGNyZWF0ZURhdGEpO1xuXG4gICAgbGV0IHNoaXBtZW50SWQgPSBudWxsO1xuICAgIGxldCBhd2JDb2RlID0gJyc7XG5cbiAgICBpZiAoY3JlYXRlRGF0YS5zaGlwbWVudF9pZCkge1xuICAgICAgc2hpcG1lbnRJZCA9IGNyZWF0ZURhdGEuc2hpcG1lbnRfaWQ7XG4gICAgICBhd2JDb2RlID0gY3JlYXRlRGF0YS5hd2JfY29kZSB8fCAnJztcbiAgICB9IGVsc2UgaWYgKGNyZWF0ZURhdGEuZGF0YSAmJiBjcmVhdGVEYXRhLmRhdGEuc2hpcG1lbnRfaWQpIHtcbiAgICAgIHNoaXBtZW50SWQgPSBjcmVhdGVEYXRhLmRhdGEuc2hpcG1lbnRfaWQ7XG4gICAgICBhd2JDb2RlID0gY3JlYXRlRGF0YS5kYXRhLmF3Yl9jb2RlIHx8ICcnO1xuICAgIH0gZWxzZSBpZiAoY3JlYXRlRGF0YS5kYXRhICYmIGNyZWF0ZURhdGEuZGF0YS5kYXRhICYmIEFycmF5LmlzQXJyYXkoY3JlYXRlRGF0YS5kYXRhLmRhdGEpICYmIGNyZWF0ZURhdGEuZGF0YS5kYXRhWzBdKSB7XG4gICAgICBzaGlwbWVudElkID0gY3JlYXRlRGF0YS5kYXRhLmRhdGFbMF0uc2hpcG1lbnRfaWQ7XG4gICAgICBhd2JDb2RlID0gY3JlYXRlRGF0YS5kYXRhLmRhdGFbMF0uYXdiX2NvZGUgfHwgJyc7XG4gICAgfSBlbHNlIGlmIChjcmVhdGVEYXRhLmRhdGEgJiYgQXJyYXkuaXNBcnJheShjcmVhdGVEYXRhLmRhdGEpICYmIGNyZWF0ZURhdGEuZGF0YVswXSkge1xuICAgICAgc2hpcG1lbnRJZCA9IGNyZWF0ZURhdGEuZGF0YVswXS5zaGlwbWVudF9pZDtcbiAgICAgIGF3YkNvZGUgPSBjcmVhdGVEYXRhLmRhdGFbMF0uYXdiX2NvZGUgfHwgJyc7XG4gICAgfVxuXG4gICAgaWYgKCFzaGlwbWVudElkKSB7XG4gICAgICBpZiAoY3JlYXRlRGF0YS5tZXNzYWdlKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgU2hpcHJvY2tldCBvcmRlciBjcmVhdGlvbiBmYWlsZWQ6ICR7Y3JlYXRlRGF0YS5tZXNzYWdlfWApO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBTaGlwcm9ja2V0IGRpZCBub3QgcmV0dXJuIGEgc2hpcG1lbnQgSUQuIFJlc3BvbnNlOiAke0pTT04uc3RyaW5naWZ5KGNyZWF0ZURhdGEpfWApO1xuICAgIH1cblxuICAgIC8vIDQuIFNjaGVkdWxlIGNvdXJpZXIgcGlja3VwXG4gICAgY29uc29sZS5sb2coYFNjaGVkdWxpbmcgcGlja3VwIGZvciBzaGlwbWVudDogJHtzaGlwbWVudElkfS4uLmApO1xuICAgIGNvbnN0IHBpY2t1cFJlcyA9IGF3YWl0IGZldGNoKCdodHRwczovL2FwaXYyLnNoaXByb2NrZXQuaW4vdjEvZXh0ZXJuYWwvY291cmllci9nZW5lcmF0ZS9waWNrdXAnLCB7XG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgJ0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi9qc29uJyxcbiAgICAgICAgJ0F1dGhvcml6YXRpb24nOiBgQmVhcmVyICR7dG9rZW59YFxuICAgICAgfSxcbiAgICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgc2hpcG1lbnRfaWQ6IFtzaGlwbWVudElkXVxuICAgICAgfSlcbiAgICB9KTtcblxuICAgIGlmICghcGlja3VwUmVzLm9rKSB7XG4gICAgICBjb25zdCBwaWNrdXBFcnJvciA9IGF3YWl0IHBpY2t1cFJlcy50ZXh0KCk7XG4gICAgICBjb25zb2xlLndhcm4oJ1NoaXByb2NrZXQgcGlja3VwIHNjaGVkdWxpbmcgd2FybmluZyAobWlnaHQgbmVlZCBtYW51YWxseSBhcHByb3ZlZC9yZS1zY2hlZHVsZWQpOicsIHBpY2t1cEVycm9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcGlja3VwRGF0YSA9IGF3YWl0IHBpY2t1cFJlcy5qc29uKCk7XG4gICAgICBjb25zb2xlLmxvZygnU2hpcHJvY2tldCBwaWNrdXAgc2NoZWR1bGVkIHN1Y2Nlc3NmdWxseTonLCBwaWNrdXBEYXRhKTtcbiAgICB9XG5cbiAgICAvLyA1LiBTYXZlIHNoaXBtZW50IG1ldGFkYXRhIGluIFN1cGFiYXNlXG4gICAgY29uc29sZS5sb2coJ1NhdmluZyBzaGlwbWVudCBkZXRhaWxzIGluIGxvY2FsIGRhdGFiYXNlLi4uJyk7XG4gICAgY29uc3QgcGdDb25uZWN0aW9uU3RyaW5nID0gcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMO1xuICAgIGlmICghcGdDb25uZWN0aW9uU3RyaW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RBVEFCQVNFX1VSTCBpcyBub3QgY29uZmlndXJlZCBpbiB0aGUgZW52aXJvbm1lbnQuJyk7XG4gICAgfVxuICAgIGNvbnN0IGRiQ2xpZW50ID0gbmV3IENsaWVudCh7XG4gICAgICBjb25uZWN0aW9uU3RyaW5nOiBwZ0Nvbm5lY3Rpb25TdHJpbmcsXG4gICAgICBzc2w6IHsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSB9XG4gICAgfSk7XG5cbiAgICBhd2FpdCBkYkNsaWVudC5jb25uZWN0KCk7XG4gICAgXG4gICAgYXdhaXQgZGJDbGllbnQucXVlcnkoYFxuICAgICAgVVBEQVRFIHB1YmxpYy5vcmRlcnNcbiAgICAgIFNFVCBzaGlwcm9ja2V0X3NoaXBtZW50X2lkID0gJDEsIHNoaXByb2NrZXRfYXdiID0gJDJcbiAgICAgIFdIRVJFIGlkID0gJDNcbiAgICBgLCBbU3RyaW5nKHNoaXBtZW50SWQpLCBTdHJpbmcoYXdiQ29kZSksIG9yZGVyVXVpZF0pO1xuXG4gICAgYXdhaXQgZGJDbGllbnQuZW5kKCk7XG4gICAgY29uc29sZS5sb2coJ09yZGVyIHNoaXBtZW50IG1ldGFkYXRhIHVwZGF0ZWQgaW4gZGF0YWJhc2Ugc3VjY2Vzc2Z1bGx5IScpO1xuXG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDIwMCwge1xuICAgICAgc3VjY2VzczogdHJ1ZSxcbiAgICAgIHNoaXBtZW50X2lkOiBzaGlwbWVudElkLFxuICAgICAgYXdiX2NvZGU6IGF3YkNvZGVcbiAgICB9KTtcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGhhbmRsaW5nIFNoaXByb2NrZXQgaW50ZWdyYXRpb246JywgZXJyb3IpO1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA1MDAsIHsgZXJyb3I6IGVycm9yLm1lc3NhZ2UgfHwgJ0ludGVybmFsIFNoaXByb2NrZXQgc2VydmVyIGVycm9yJyB9KTtcbiAgfVxufVxuIiwgImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhYmR1bFxcXFxEb3dubG9hZHNcXFxcU29zaGthXFxcXFNvc2hrYVxcXFxlY29tbWVyY2UtYXBwXFxcXGFwaVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcYWJkdWxcXFxcRG93bmxvYWRzXFxcXFNvc2hrYVxcXFxTb3Noa2FcXFxcZWNvbW1lcmNlLWFwcFxcXFxhcGlcXFxcc2VuZC1vcmRlci1jb25maXJtYXRpb24uanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2FiZHVsL0Rvd25sb2Fkcy9Tb3Noa2EvU29zaGthL2Vjb21tZXJjZS1hcHAvYXBpL3NlbmQtb3JkZXItY29uZmlybWF0aW9uLmpzXCI7aW1wb3J0IG5vZGVtYWlsZXIgZnJvbSAnbm9kZW1haWxlcic7XG5pbXBvcnQgZnMgZnJvbSAnZnMnO1xuaW1wb3J0IHBhdGggZnJvbSAncGF0aCc7XG5cbi8vIEhlbHBlciB0byBsb2FkIGZhbGxiYWNrIGVudmlyb25tZW50IHZhcmlhYmxlcyBsb2NhbGx5XG5mdW5jdGlvbiBsb2FkRW52RmFsbGJhY2soKSB7XG4gIHRyeSB7XG4gICAgY29uc3QgZW52UGF0aCA9IHBhdGguam9pbihwcm9jZXNzLmN3ZCgpLCAnLmVudicpO1xuICAgIGlmIChmcy5leGlzdHNTeW5jKGVudlBhdGgpKSB7XG4gICAgICBjb25zdCBjb250ZW50ID0gZnMucmVhZEZpbGVTeW5jKGVudlBhdGgsICd1dGY4Jyk7XG4gICAgICBjb25zdCBsaW5lcyA9IGNvbnRlbnQuc3BsaXQoJ1xcbicpO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgICAgIGNvbnN0IHRyaW1tZWQgPSBsaW5lLnRyaW0oKTtcbiAgICAgICAgaWYgKHRyaW1tZWQgJiYgIXRyaW1tZWQuc3RhcnRzV2l0aCgnIycpKSB7XG4gICAgICAgICAgY29uc3QgZmlyc3RFcXVhbCA9IHRyaW1tZWQuaW5kZXhPZignPScpO1xuICAgICAgICAgIGlmIChmaXJzdEVxdWFsICE9PSAtMSkge1xuICAgICAgICAgICAgY29uc3Qga2V5ID0gdHJpbW1lZC5zbGljZSgwLCBmaXJzdEVxdWFsKS50cmltKCk7XG4gICAgICAgICAgICBjb25zdCB2YWwgPSB0cmltbWVkLnNsaWNlKGZpcnN0RXF1YWwgKyAxKS50cmltKCk7XG4gICAgICAgICAgICBwcm9jZXNzLmVudltrZXldID0gdmFsO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcignRXJyb3IgbG9hZGluZyBmYWxsYmFjayAuZW52OicsIGVycik7XG4gIH1cbn1cblxuLy8gSGVscGVyIHRvIHBhcnNlIHJlcXVlc3QgYm9keVxuYXN5bmMgZnVuY3Rpb24gZ2V0UmVxdWVzdEJvZHkocmVxKSB7XG4gIGlmIChyZXEuYm9keSkge1xuICAgIHJldHVybiB0eXBlb2YgcmVxLmJvZHkgPT09ICdzdHJpbmcnID8gSlNPTi5wYXJzZShyZXEuYm9keSkgOiByZXEuYm9keTtcbiAgfVxuICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIGxldCBib2R5ID0gJyc7XG4gICAgcmVxLm9uKCdkYXRhJywgY2h1bmsgPT4ge1xuICAgICAgYm9keSArPSBjaHVuay50b1N0cmluZygpO1xuICAgIH0pO1xuICAgIHJlcS5vbignZW5kJywgKCkgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzb2x2ZShib2R5ID8gSlNPTi5wYXJzZShib2R5KSA6IHt9KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXEub24oJ2Vycm9yJywgZXJyID0+IHJlamVjdChlcnIpKTtcbiAgfSk7XG59XG5cbi8vIEhlbHBlciB0byBzZW5kIEpTT04gcmVzcG9uc2VzXG5mdW5jdGlvbiBzZW5kUmVzcG9uc2UocmVzLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gIGlmICh0eXBlb2YgcmVzLnN0YXR1cyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiByZXMuc3RhdHVzKHN0YXR1c0NvZGUpLmpzb24oZGF0YSk7XG4gIH1cbiAgcmVzLndyaXRlSGVhZChzdGF0dXNDb2RlLCB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSk7XG4gIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xufVxuXG4vLyBGb3JtYXQgY3VycmVuY3kgaW4gSW5kaWFuIFJ1cGVlc1xuZnVuY3Rpb24gZm9ybWF0SU5SKHZhbHVlKSB7XG4gIHJldHVybiBuZXcgSW50bC5OdW1iZXJGb3JtYXQoJ2VuLUlOJywge1xuICAgIHN0eWxlOiAnY3VycmVuY3knLFxuICAgIGN1cnJlbmN5OiAnSU5SJyxcbiAgICBtaW5pbXVtRnJhY3Rpb25EaWdpdHM6IDJcbiAgfSkuZm9ybWF0KHZhbHVlKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgYXN5bmMgZnVuY3Rpb24gaGFuZGxlcihyZXEsIHJlcykge1xuICAvLyBBbGxvdyBvbmx5IFBPU1QgcmVxdWVzdHNcbiAgaWYgKHJlcS5tZXRob2QgIT09ICdQT1NUJykge1xuICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDUsIHsgZXJyb3I6ICdNZXRob2Qgbm90IGFsbG93ZWQnIH0pO1xuICB9XG5cbiAgbG9hZEVudkZhbGxiYWNrKCk7XG5cbiAgdHJ5IHtcbiAgICBjb25zdCBib2R5ID0gYXdhaXQgZ2V0UmVxdWVzdEJvZHkocmVxKTtcbiAgICBjb25zdCB7IG9yZGVyLCBlbWFpbCB9ID0gYm9keTtcblxuICAgIGlmICghb3JkZXIpIHtcbiAgICAgIHJldHVybiBzZW5kUmVzcG9uc2UocmVzLCA0MDAsIHsgZXJyb3I6ICdPcmRlciBkZXRhaWxzIGFyZSByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgbGV0IGN1c3RvbWVyRW1haWwgPSBlbWFpbDtcbiAgICBpZiAoIWN1c3RvbWVyRW1haWwgJiYgb3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8uZW1haWwpIHtcbiAgICAgIGN1c3RvbWVyRW1haWwgPSBvcmRlci5zaGlwcGluZ19hZGRyZXNzLmVtYWlsO1xuICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGN1c3RvbWVyIGVtYWlsIGZyb20gb3JkZXIuc2hpcHBpbmdfYWRkcmVzczonLCBjdXN0b21lckVtYWlsKTtcbiAgICB9XG4gICAgaWYgKCFjdXN0b21lckVtYWlsICYmIG9yZGVyLnVzZXJfaWQpIHtcbiAgICAgIGNvbnNvbGUubG9nKCdFbWFpbCBub3QgcHJvdmlkZWQgaW4gYm9keS4gUXVlcnlpbmcgZGF0YWJhc2UgZm9yIHVzZXIgZW1haWwuLi4nKTtcbiAgICAgIGNvbnN0IHBnQ29ubmVjdGlvblN0cmluZyA9IHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTDtcbiAgICAgIGlmIChwZ0Nvbm5lY3Rpb25TdHJpbmcpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB7IENsaWVudCB9ID0gYXdhaXQgaW1wb3J0KCdwZycpO1xuICAgICAgICAgIGNvbnN0IGRiQ2xpZW50ID0gbmV3IENsaWVudCh7XG4gICAgICAgICAgICBjb25uZWN0aW9uU3RyaW5nOiBwZ0Nvbm5lY3Rpb25TdHJpbmcsXG4gICAgICAgICAgICBzc2w6IHsgcmVqZWN0VW5hdXRob3JpemVkOiBmYWxzZSB9XG4gICAgICAgICAgfSk7XG4gICAgICAgICAgYXdhaXQgZGJDbGllbnQuY29ubmVjdCgpO1xuICAgICAgICAgIFxuICAgICAgICAgIC8vIFRyeSB0byBmZXRjaCBmcm9tIHByb2ZpbGVzIGZpcnN0XG4gICAgICAgICAgY29uc3QgcHJvZmlsZVJlcyA9IGF3YWl0IGRiQ2xpZW50LnF1ZXJ5KCdTRUxFQ1QgZW1haWwgRlJPTSBwdWJsaWMucHJvZmlsZXMgV0hFUkUgaWQgPSAkMScsIFtvcmRlci51c2VyX2lkXSk7XG4gICAgICAgICAgaWYgKHByb2ZpbGVSZXMucm93cyAmJiBwcm9maWxlUmVzLnJvd3NbMF0/LmVtYWlsKSB7XG4gICAgICAgICAgICBjdXN0b21lckVtYWlsID0gcHJvZmlsZVJlcy5yb3dzWzBdLmVtYWlsO1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0ZvdW5kIGN1c3RvbWVyIGVtYWlsIGZyb20gcHVibGljLnByb2ZpbGVzOicsIGN1c3RvbWVyRW1haWwpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUcnkgdG8gZmV0Y2ggZnJvbSBhdXRoLnVzZXJzIChyZXF1aXJlcyBEQiBhY2Nlc3MgcHJpdmlsZWdlcylcbiAgICAgICAgICAgIGNvbnN0IHVzZXJSZXMgPSBhd2FpdCBkYkNsaWVudC5xdWVyeSgnU0VMRUNUIGVtYWlsIEZST00gYXV0aC51c2VycyBXSEVSRSBpZCA9ICQxJywgW29yZGVyLnVzZXJfaWRdKTtcbiAgICAgICAgICAgIGlmICh1c2VyUmVzLnJvd3MgJiYgdXNlclJlcy5yb3dzWzBdPy5lbWFpbCkge1xuICAgICAgICAgICAgICBjdXN0b21lckVtYWlsID0gdXNlclJlcy5yb3dzWzBdLmVtYWlsO1xuICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRm91bmQgY3VzdG9tZXIgZW1haWwgZnJvbSBhdXRoLnVzZXJzOicsIGN1c3RvbWVyRW1haWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBhd2FpdCBkYkNsaWVudC5lbmQoKTtcbiAgICAgICAgfSBjYXRjaCAoZGJFcnIpIHtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB1c2VyIGVtYWlsIGZyb20gREI6JywgZGJFcnIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKCFjdXN0b21lckVtYWlsKSB7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7IGVycm9yOiAnQ3VzdG9tZXIgZW1haWwgYWRkcmVzcyBpcyByZXF1aXJlZCcgfSk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdCA9IHByb2Nlc3MuZW52LlNNVFBfSE9TVDtcbiAgICBjb25zdCBwb3J0ID0gcGFyc2VJbnQocHJvY2Vzcy5lbnYuU01UUF9QT1JUIHx8ICc1ODcnLCAxMCk7XG4gICAgY29uc3QgdXNlciA9IHByb2Nlc3MuZW52LlNNVFBfVVNFUjtcbiAgICBjb25zdCBwYXNzID0gcHJvY2Vzcy5lbnYuU01UUF9QQVNTO1xuXG4gICAgLy8gVmVyaWZ5IFNNVFAgc2V0dGluZ3NcbiAgICBpZiAoIWhvc3QgfHwgIXVzZXIgfHwgIXBhc3MpIHtcbiAgICAgIGNvbnNvbGUud2FybignU01UUCBjb25maWd1cmF0aW9uIGlzIG1pc3NpbmcuJyk7XG4gICAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgNDAwLCB7XG4gICAgICAgIGVycm9yOiAnU01UUCBjcmVkZW50aWFscyBhcmUgbm90IGZ1bGx5IGNvbmZpZ3VyZWQgaW4geW91ciBlbnZpcm9ubWVudC4nXG4gICAgICB9KTtcbiAgICB9XG5cbiAgICAvLyBSZWNhbGN1bGF0ZSBjYWxjdWxhdGlvbnMgdG8gdmVyaWZ5IGludm9pY2Ugc3BsaXRzXG4gICAgY29uc3QgaXRlbXMgPSBvcmRlci5pdGVtcyB8fCBbXTtcbiAgICBjb25zdCBzdWJ0b3RhbCA9IGl0ZW1zLnJlZHVjZSgoYWNjLCBpdGVtKSA9PiBhY2MgKyAoaXRlbS5wcmljZSAqIGl0ZW0ucXVhbnRpdHkpLCAwKTtcbiAgICBjb25zdCBkaXNwbGF5T3JkZXJJZCA9IG9yZGVyLmlkLnN0YXJ0c1dpdGgoJzAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLScpID8gb3JkZXIuaWQuc3BsaXQoJy0nKS5wb3AoKSA6IG9yZGVyLmlkLnNsaWNlKDAsIDgpLnRvVXBwZXJDYXNlKCk7XG4gICAgXG4gICAgLy8gVXNlIGltcG9ydGVkIGNvbnN0YW50cyBlcXVpdmFsZW50IGxvZ2ljXG4gICAgY29uc3QgU0hJUFBJTkdfQ0hBUkdFUyA9IDA7XG4gICAgY29uc3QgRlJFRV9TSElQUElOR19USFJFU0hPTEQgPSAwO1xuICAgIGNvbnN0IFRBWF9SQVRFID0gMC4wMDtcblxuICAgIGNvbnN0IHNoaXBwaW5nQ29zdCA9IDA7XG4gICAgY29uc3QgdGF4Q29zdCA9IDA7XG5cbiAgICAvLyBDcmVhdGUgYSBub2RlbWFpbGVyIHRyYW5zcG9ydGVyXG4gICAgY29uc3QgdHJhbnNwb3J0ZXIgPSBub2RlbWFpbGVyLmNyZWF0ZVRyYW5zcG9ydCh7XG4gICAgICBob3N0LFxuICAgICAgcG9ydCxcbiAgICAgIHNlY3VyZTogcG9ydCA9PT0gNDY1LFxuICAgICAgYXV0aDoge1xuICAgICAgICB1c2VyLFxuICAgICAgICBwYXNzLFxuICAgICAgfSxcbiAgICAgIHRsczoge1xuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IGZhbHNlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBCdWlsZCB0aGUgcHJlbWl1bSB0aGVtZWQgU1x1MDBGNXNoa2EgT3JkZXIgSW52b2ljZVxuICAgIGNvbnN0IGh0bWxDb250ZW50ID0gYFxuICAgICAgPCFET0NUWVBFIGh0bWw+XG4gICAgICA8aHRtbD5cbiAgICAgIDxoZWFkPlxuICAgICAgICA8bWV0YSBjaGFyc2V0PVwidXRmLThcIj5cbiAgICAgICAgPHN0eWxlPlxuICAgICAgICAgIGJvZHkge1xuICAgICAgICAgICAgZm9udC1mYW1pbHk6ICdIZWx2ZXRpY2EgTmV1ZScsIEhlbHZldGljYSwgQXJpYWwsIHNhbnMtc2VyaWY7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmFmYWZhO1xuICAgICAgICAgICAgbWFyZ2luOiAwO1xuICAgICAgICAgICAgcGFkZGluZzogMDtcbiAgICAgICAgICAgIGNvbG9yOiAjMjYyNjI2O1xuICAgICAgICAgIH1cbiAgICAgICAgICAuZW1haWwtY29udGFpbmVyIHtcbiAgICAgICAgICAgIG1heC13aWR0aDogNjAwcHg7XG4gICAgICAgICAgICBtYXJnaW46IDMwcHggYXV0bztcbiAgICAgICAgICAgIGJhY2tncm91bmQ6ICNmZmZmZmY7XG4gICAgICAgICAgICBib3JkZXI6IDFweCBzb2xpZCAjZWFlYWVhO1xuICAgICAgICAgICAgYm9yZGVyLXJhZGl1czogMTZweDtcbiAgICAgICAgICAgIG92ZXJmbG93OiBoaWRkZW47XG4gICAgICAgICAgICBib3gtc2hhZG93OiAwIDRweCAxMnB4IHJnYmEoMCwwLDAsMC4wMyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5icmFuZC1oZWFkZXIge1xuICAgICAgICAgICAgYmFja2dyb3VuZC1jb2xvcjogIzk4MTgzZjtcbiAgICAgICAgICAgIGJhY2tncm91bmQtaW1hZ2U6IGxpbmVhci1ncmFkaWVudCgxMzVkZWcsICM5ODE4M2YgMCUsICM2NDBmMjggMTAwJSk7XG4gICAgICAgICAgICBwYWRkaW5nOiAzMHB4O1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuYnJhbmQtbmFtZSB7XG4gICAgICAgICAgICBmb250LXNpemU6IDI4cHg7XG4gICAgICAgICAgICBmb250LXdlaWdodDogODAwO1xuICAgICAgICAgICAgY29sb3I6ICNmZmZmZmY7XG4gICAgICAgICAgICBsZXR0ZXItc3BhY2luZzogNHB4O1xuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgIG1hcmdpbjogMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmJyYW5kLXN1YnRpdGxlIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTFweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgICBjb2xvcjogI2Y3YTBiOTtcbiAgICAgICAgICAgIGxldHRlci1zcGFjaW5nOiAycHg7XG4gICAgICAgICAgICB0ZXh0LXRyYW5zZm9ybTogdXBwZXJjYXNlO1xuICAgICAgICAgICAgbWFyZ2luOiA1cHggMCAwIDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5pbnZvaWNlLWJvZHkge1xuICAgICAgICAgICAgcGFkZGluZzogMzVweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmdyZWV0aW5nIHtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMThweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA3MDA7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiAwO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogOHB4O1xuICAgICAgICAgICAgY29sb3I6ICMxYTFhMWE7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5vcmRlci1zdGF0dXMtYmFubmVyIHtcbiAgICAgICAgICAgIGJhY2tncm91bmQtY29sb3I6ICNmZGYyZjU7XG4gICAgICAgICAgICBib3JkZXItbGVmdDogNHB4IHNvbGlkICNmZjJhODU7XG4gICAgICAgICAgICBwYWRkaW5nOiAxNXB4O1xuICAgICAgICAgICAgbWFyZ2luOiAyMHB4IDA7XG4gICAgICAgICAgICBib3JkZXItcmFkaXVzOiA0cHg7XG4gICAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgICAgY29sb3I6ICM5ODE4M2Y7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5tZXRhLXRhYmxlIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgbWFyZ2luLWJvdHRvbTogMjVweDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTJweDtcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDFweCBzb2xpZCAjZWFlYWVhO1xuICAgICAgICAgICAgcGFkZGluZy1ib3R0b206IDE1cHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5tZXRhLWxhYmVsIHtcbiAgICAgICAgICAgIGNvbG9yOiAjOGM4YzhjO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMXB4O1xuICAgICAgICAgICAgd2lkdGg6IDMwJTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLm1ldGEtdmFsdWUge1xuICAgICAgICAgICAgY29sb3I6ICMyNjI2MjY7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuaXRlbXMtdGFibGUge1xuICAgICAgICAgICAgd2lkdGg6IDEwMCU7XG4gICAgICAgICAgICBib3JkZXItY29sbGFwc2U6IGNvbGxhcHNlO1xuICAgICAgICAgICAgbWFyZ2luOiAyMHB4IDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5pdGVtcy1oZWFkZXIge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMHB4O1xuICAgICAgICAgICAgdGV4dC10cmFuc2Zvcm06IHVwcGVyY2FzZTtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDA7XG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcbiAgICAgICAgICAgIGJvcmRlci1ib3R0b206IDJweCBzb2xpZCAjZWFlYWVhO1xuICAgICAgICAgICAgcGFkZGluZy1ib3R0b206IDEwcHg7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiBsZWZ0O1xuICAgICAgICAgIH1cbiAgICAgICAgICAuaXRlbS1yb3cgdGQge1xuICAgICAgICAgICAgcGFkZGluZzogMTVweCAwO1xuICAgICAgICAgICAgYm9yZGVyLWJvdHRvbTogMXB4IHNvbGlkICNmNWY1ZjU7XG4gICAgICAgICAgICBmb250LXNpemU6IDEzcHg7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuaXRlbS1uYW1lIHtcbiAgICAgICAgICAgIGNvbG9yOiAjMWExYTFhO1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDcwMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLml0ZW0tbWV0YSB7XG4gICAgICAgICAgICBmb250LXNpemU6IDExcHg7XG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA1MDA7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiA0cHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5jYWxjdWxhdGlvbi1zZWN0aW9uIHtcbiAgICAgICAgICAgIHdpZHRoOiAxMDAlO1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMTVweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmNhbGN1bGF0aW9uLXJvdyB0ZCB7XG4gICAgICAgICAgICBwYWRkaW5nOiA4cHggMDtcbiAgICAgICAgICAgIGZvbnQtc2l6ZTogMTNweDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA2MDA7XG4gICAgICAgICAgfVxuICAgICAgICAgIC5jYWxjdWxhdGlvbi1sYWJlbCB7XG4gICAgICAgICAgICBjb2xvcjogIzhjOGM4YztcbiAgICAgICAgICAgIHRleHQtYWxpZ246IHJpZ2h0O1xuICAgICAgICAgICAgcGFkZGluZy1yaWdodDogMjVweDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmNhbGN1bGF0aW9uLXZhbCB7XG4gICAgICAgICAgICB0ZXh0LWFsaWduOiByaWdodDtcbiAgICAgICAgICAgIHdpZHRoOiAyNSU7XG4gICAgICAgICAgICBjb2xvcjogIzI2MjYyNjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLnRvdGFsLXJvdyB0ZCB7XG4gICAgICAgICAgICBib3JkZXItdG9wOiAycHggc29saWQgI2VhZWFlYTtcbiAgICAgICAgICAgIHBhZGRpbmctdG9wOiAxNXB4ICFpbXBvcnRhbnQ7XG4gICAgICAgICAgICBmb250LXNpemU6IDE2cHggIWltcG9ydGFudDtcbiAgICAgICAgICAgIGZvbnQtd2VpZ2h0OiA4MDAgIWltcG9ydGFudDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLnRvdGFsLXJvdyAuY2FsY3VsYXRpb24tbGFiZWwge1xuICAgICAgICAgICAgY29sb3I6ICMxYTFhMWE7XG4gICAgICAgICAgfVxuICAgICAgICAgIC50b3RhbC1yb3cgLmNhbGN1bGF0aW9uLXZhbCB7XG4gICAgICAgICAgICBjb2xvcjogIzk4MTgzZjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmFkZHJlc3MtY2FyZCB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZmNmY2ZjO1xuICAgICAgICAgICAgYm9yZGVyOiAxcHggc29saWQgI2YwZjBmMDtcbiAgICAgICAgICAgIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgICAgICAgICAgIHBhZGRpbmc6IDIwcHg7XG4gICAgICAgICAgICBtYXJnaW4tdG9wOiAzMHB4O1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMnB4O1xuICAgICAgICAgICAgbGluZS1oZWlnaHQ6IDEuNjtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmFkZHJlc3MtdGl0bGUge1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgZm9udC13ZWlnaHQ6IDgwMDtcbiAgICAgICAgICAgIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gICAgICAgICAgICBsZXR0ZXItc3BhY2luZzogMXB4O1xuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XG4gICAgICAgICAgICBtYXJnaW4tYm90dG9tOiAxMHB4O1xuICAgICAgICAgICAgbWFyZ2luLXRvcDogMDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLmJyYW5kLWZvb3RlciB7XG4gICAgICAgICAgICBiYWNrZ3JvdW5kLWNvbG9yOiAjZjdmN2Y3O1xuICAgICAgICAgICAgYm9yZGVyLXRvcDogMXB4IHNvbGlkICNlYWVhZWE7XG4gICAgICAgICAgICBwYWRkaW5nOiAyNXB4O1xuICAgICAgICAgICAgdGV4dC1hbGlnbjogY2VudGVyO1xuICAgICAgICAgICAgZm9udC1zaXplOiAxMXB4O1xuICAgICAgICAgICAgY29sb3I6ICM4YzhjOGM7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNTAwO1xuICAgICAgICAgIH1cbiAgICAgICAgICAuYnJhbmQtZm9vdGVyIGEge1xuICAgICAgICAgICAgY29sb3I6ICM5ODE4M2Y7XG4gICAgICAgICAgICB0ZXh0LWRlY29yYXRpb246IG5vbmU7XG4gICAgICAgICAgICBmb250LXdlaWdodDogNjUwO1xuICAgICAgICAgIH1cbiAgICAgICAgPC9zdHlsZT5cbiAgICAgIDwvaGVhZD5cbiAgICAgIDxib2R5PlxuICAgICAgICA8ZGl2IGNsYXNzPVwiZW1haWwtY29udGFpbmVyXCI+XG4gICAgICAgICAgPGRpdiBjbGFzcz1cImJyYW5kLWhlYWRlclwiPlxuICAgICAgICAgICAgPGgxIGNsYXNzPVwiYnJhbmQtbmFtZVwiPlNcdTAwRjVzaGthPC9oMT5cbiAgICAgICAgICAgIDxwIGNsYXNzPVwiYnJhbmQtc3VidGl0bGVcIj5GaW5lIEpld2VsbGVyeTwvcD5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiaW52b2ljZS1ib2R5XCI+XG4gICAgICAgICAgICA8aDIgY2xhc3M9XCJncmVldGluZ1wiPlRoYW5rIFlvdSBmb3IgWW91ciBPcmRlciE8L2gyPlxuICAgICAgICAgICAgPHAgc3R5bGU9XCJmb250LXNpemU6IDEzcHg7IGNvbG9yOiAjNjY2OyBtYXJnaW46IDAgMCAyMHB4IDA7IGxpbmUtaGVpZ2h0OiAxLjU7XCI+XG4gICAgICAgICAgICAgIFdlIGhhdmUgcmVjZWl2ZWQgeW91ciBwdXJjaGFzZSByZXF1ZXN0LiBPdXIgYXJ0aXNhbnMgYXJlIHByZXBhcmluZyB5b3VyIHNlbGVjdGVkIGl0ZW1zIHdpdGggY2FyZS4gWW91IGNhbiBmaW5kIHlvdXIgb3JkZXIgcmVjZWlwdCBkZXRhaWxzIG91dGxpbmVkIGJlbG93OlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwib3JkZXItc3RhdHVzLWJhbm5lclwiPlxuICAgICAgICAgICAgICBZb3VyIG9yZGVyIGNvbmZpcm1hdGlvbiBzdGF0dXMgaXMgY3VycmVudGx5OiA8c3Ryb25nPlBST0NFU1NJTkc8L3N0cm9uZz5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICA8dGFibGUgY2xhc3M9XCJtZXRhLXRhYmxlXCI+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLWxhYmVsXCI+T3JkZXIgTnVtYmVyPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLXZhbHVlXCI+JHtkaXNwbGF5T3JkZXJJZH08L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICA8dHI+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwibWV0YS1sYWJlbFwiPkRhdGUgUGxhY2VkPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLXZhbHVlXCI+JHtuZXcgRGF0ZShvcmRlci5jcmVhdGVkX2F0IHx8IERhdGUubm93KCkpLnRvTG9jYWxlU3RyaW5nKCdlbi1JTicsIHsgdGltZVpvbmU6ICdBc2lhL0tvbGthdGEnIH0pfTwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJtZXRhLWxhYmVsXCI+VHJhbnNhY3Rpb24gSUQ8L3RkPlxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cIm1ldGEtdmFsdWVcIiBzdHlsZT1cImZvbnQtZmFtaWx5OiBtb25vc3BhY2U7XCI+JHtvcmRlci5wYXltZW50X2lkIHx8ICdDYXNoIG9uIERlbGl2ZXJ5J308L3RkPlxuICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgPC90YWJsZT5cblxuICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwiaXRlbXMtdGFibGVcIj5cbiAgICAgICAgICAgICAgPHRoZWFkPlxuICAgICAgICAgICAgICAgIDx0cj5cbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cIml0ZW1zLWhlYWRlclwiIHN0eWxlPVwid2lkdGg6IDYwJTtcIj5KZXdlbHJ5IEl0ZW08L3RoPlxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzPVwiaXRlbXMtaGVhZGVyXCIgc3R5bGU9XCJ3aWR0aDogMTUlOyB0ZXh0LWFsaWduOiBjZW50ZXI7XCI+UXR5PC90aD5cbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzcz1cIml0ZW1zLWhlYWRlclwiIHN0eWxlPVwid2lkdGg6IDI1JTsgdGV4dC1hbGlnbjogcmlnaHQ7XCI+VG90YWwgUHJpY2U8L3RoPlxuICAgICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgIDwvdGhlYWQ+XG4gICAgICAgICAgICAgIDx0Ym9keT5cbiAgICAgICAgICAgICAgICAke2l0ZW1zLm1hcChpdGVtID0+IGBcbiAgICAgICAgICAgICAgICAgIDx0ciBjbGFzcz1cIml0ZW0tcm93XCI+XG4gICAgICAgICAgICAgICAgICAgIDx0ZD5cbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzcz1cIml0ZW0tbmFtZVwiPiR7aXRlbS5uYW1lfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPVwiaXRlbS1tZXRhXCI+XG4gICAgICAgICAgICAgICAgICAgICAgICBVbml0IFByaWNlOiAke2Zvcm1hdElOUihpdGVtLnByaWNlKX1cbiAgICAgICAgICAgICAgICAgICAgICAgICR7aXRlbS5zaXplID8gYCB8IFNpemU6IDxzdHJvbmc+JHtpdGVtLnNpemV9PC9zdHJvbmc+YCA6ICcnfVxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IGNvbG9yOiAjNjY2O1wiPiR7aXRlbS5xdWFudGl0eX08L3RkPlxuICAgICAgICAgICAgICAgICAgICA8dGQgc3R5bGU9XCJ0ZXh0LWFsaWduOiByaWdodDsgY29sb3I6ICMxYTFhMWE7XCI+JHtmb3JtYXRJTlIoaXRlbS5wcmljZSAqIGl0ZW0ucXVhbnRpdHkpfTwvdGQ+XG4gICAgICAgICAgICAgICAgICA8L3RyPlxuICAgICAgICAgICAgICAgIGApLmpvaW4oJycpfVxuICAgICAgICAgICAgICA8L3Rib2R5PlxuICAgICAgICAgICAgPC90YWJsZT5cblxuICAgICAgICAgICAgPHRhYmxlIGNsYXNzPVwiY2FsY3VsYXRpb24tc2VjdGlvblwiPlxuICAgICAgICAgICAgICA8dHIgY2xhc3M9XCJjYWxjdWxhdGlvbi1yb3dcIj5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxjdWxhdGlvbi1sYWJlbFwiPlN1YnRvdGFsPC90ZD5cbiAgICAgICAgICAgICAgICA8dGQgY2xhc3M9XCJjYWxjdWxhdGlvbi12YWxcIj4ke2Zvcm1hdElOUihzdWJ0b3RhbCl9PC90ZD5cbiAgICAgICAgICAgICAgPC90cj5cbiAgICAgICAgICAgICAgJHtvcmRlci5jb2RfZmVlICYmIE51bWJlcihvcmRlci5jb2RfZmVlKSA+IDAgPyBgXG4gICAgICAgICAgICAgIDx0ciBjbGFzcz1cImNhbGN1bGF0aW9uLXJvd1wiPlxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+Q2FzaCBvbiBEZWxpdmVyeSAoQ09EKSBGZWU8L3RkPlxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLXZhbFwiPiR7Zm9ybWF0SU5SKG9yZGVyLmNvZF9mZWUpfTwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICAgIGAgOiAnJ31cbiAgICAgICAgICAgICAgPHRyIGNsYXNzPVwiY2FsY3VsYXRpb24tcm93IHRvdGFsLXJvd1wiPlxuICAgICAgICAgICAgICAgIDx0ZCBjbGFzcz1cImNhbGN1bGF0aW9uLWxhYmVsXCI+JHtvcmRlci5wYXltZW50X21ldGhvZCA9PT0gJ2NvZCcgPyAnVG90YWwgQW1vdW50IHRvIFBheScgOiAnVG90YWwgQW1vdW50IFBhaWQnfTwvdGQ+XG4gICAgICAgICAgICAgICAgPHRkIGNsYXNzPVwiY2FsY3VsYXRpb24tdmFsXCI+JHtmb3JtYXRJTlIob3JkZXIudG90YWwpfTwvdGQ+XG4gICAgICAgICAgICAgIDwvdHI+XG4gICAgICAgICAgICA8L3RhYmxlPlxuXG4gICAgICAgICAgICA8ZGl2IGNsYXNzPVwiYWRkcmVzcy1jYXJkXCI+XG4gICAgICAgICAgICAgIDxoNCBjbGFzcz1cImFkZHJlc3MtdGl0bGVcIj5cdUQ4M0RcdURDQ0QgRGlzcGF0Y2ggQWRkcmVzczwvaDQ+XG4gICAgICAgICAgICAgIDxzdHJvbmcgc3R5bGU9XCJjb2xvcjogIzFhMWExYTsgZm9udC1zaXplOiAxM3B4O1wiPiR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ubmFtZX08L3N0cm9uZz48YnIgLz5cbiAgICAgICAgICAgICAgJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5hZGRyZXNzTGluZSB8fCBvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5saW5lMX08YnIgLz5cbiAgICAgICAgICAgICAgJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5jaXR5fSwgJHtvcmRlci5zaGlwcGluZ19hZGRyZXNzPy5zdGF0ZX0gLSAke29yZGVyLnNoaXBwaW5nX2FkZHJlc3M/LnBvc3RhbENvZGUgfHwgb3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ucG9zdGFsX2NvZGV9PGJyIC8+XG4gICAgICAgICAgICAgIENvbnRhY3Q6ICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ucGhvbmV9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICBcbiAgICAgICAgICA8ZGl2IGNsYXNzPVwiYnJhbmQtZm9vdGVyXCI+XG4gICAgICAgICAgICA8cD5JZiB5b3UgaGF2ZSBhbnkgcXVlc3Rpb25zLCBwbGVhc2UgY29udGFjdCBvdXIgY3VzdG9tIHNlcnZpY2UgZGVzayBhdCA8YSBocmVmPVwibWFpbHRvOnN1cHBvcnRAc29zaGthLmluXCI+c3VwcG9ydEBzb3Noa2EuaW48L2E+PC9wPlxuICAgICAgICAgICAgPHAgc3R5bGU9XCJtYXJnaW4tdG9wOiAxNXB4OyBmb250LXNpemU6IDEwcHg7IGNvbG9yOiAjYjViNWI1O1wiPiZjb3B5OyAke25ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKX0gU1x1MDBGNXNoa2EgU3RvcmUuIEFsbCByaWdodHMgcmVzZXJ2ZWQuPC9wPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvYm9keT5cbiAgICAgIDwvaHRtbD5cbiAgICBgO1xuXG4gICAgLy8gRGVmaW5lIG1haWwgb3B0aW9uc1xuICAgIGNvbnN0IG1haWxPcHRpb25zID0ge1xuICAgICAgZnJvbTogYFwiU29zaGthIEpld2VsbGVyeVwiIDwke3VzZXJ9PmAsXG4gICAgICB0bzogY3VzdG9tZXJFbWFpbCxcbiAgICAgIHJlcGx5VG86IFwic29zaGthLmluQGdtYWlsLmNvbVwiLFxuICAgICAgc3ViamVjdDogYE9yZGVyIENvbmZpcm1lZCAtIEludm9pY2UgIyR7ZGlzcGxheU9yZGVySWR9IHwgU29zaGthYCxcbiAgICAgIHRleHQ6IGBUaGFuayB5b3UgZm9yIHlvdXIgcHVyY2hhc2UgZnJvbSBTb3Noa2EgU3RvcmUhXFxuXFxuT3JkZXIgTnVtYmVyOiAke2Rpc3BsYXlPcmRlcklkfVxcblRvdGFsIEFtb3VudDogJHtmb3JtYXRJTlIob3JkZXIudG90YWwpfVxcblxcblRoYW5rIHlvdSBmb3Igc2hvcHBpbmcgd2l0aCB1cyFgLFxuICAgICAgaHRtbDogaHRtbENvbnRlbnQsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIFwiWC1BdXRvLVJlc3BvbnNlLVN1cHByZXNzXCI6IFwiQWxsXCIsXG4gICAgICAgIFwiUHJlY2VkZW5jZVwiOiBcImJ1bGtcIlxuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBTZW5kIHRoZSBlbWFpbFxuICAgIGF3YWl0IHRyYW5zcG9ydGVyLnNlbmRNYWlsKG1haWxPcHRpb25zKTtcblxuICAgIC8vIFNpbXVsYXRlIFdoYXRzQXBwIGJhY2tlbmQgbm90aWZpY2F0aW9uIGxvZ2dpbmdcbiAgICBjb25zb2xlLmxvZyhgW1doYXRzQXBwIE5vdGlmaWNhdGlvbiBRdWV1ZWRdIE1lc3NhZ2U6IFwiRGVhciAke29yZGVyLnNoaXBwaW5nX2FkZHJlc3M/Lm5hbWV9LCB5b3VyIFNcdTAwRjVzaGthIG9yZGVyICMke29yZGVyLmlkLnNsaWNlKDAsIDgpfSBvZiAke2Zvcm1hdElOUihvcmRlci50b3RhbCl9IGlzIGNvbmZpcm1lZC5cIiBzZW50IHRvICR7b3JkZXIuc2hpcHBpbmdfYWRkcmVzcz8ucGhvbmV9YCk7XG5cbiAgICByZXR1cm4gc2VuZFJlc3BvbnNlKHJlcywgMjAwLCB7IHN1Y2Nlc3M6IHRydWUsIG1lc3NhZ2U6ICdFbWFpbCBpbnZvaWNlIHNlbnQgc3VjY2Vzc2Z1bGx5JyB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIG9yZGVyIGNvbmZpcm1hdGlvbiBlbWFpbDonLCBlcnJvcik7XG4gICAgcmV0dXJuIHNlbmRSZXNwb25zZShyZXMsIDUwMCwgeyBlcnJvcjogZXJyb3IubWVzc2FnZSB8fCAnRmFpbGVkIHRvIHNlbmQgZW1haWwgY29uZmlybWF0aW9uJyB9KTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VixTQUFTLGNBQWMsZUFBZTtBQUNsWSxPQUFPLFdBQVc7OztBQ0QwVixPQUFPLGNBQWM7QUFDalksT0FBTyxRQUFRO0FBQ2YsT0FBTyxVQUFVO0FBRWpCLFNBQVMsa0JBQWtCO0FBQ3pCLE1BQUk7QUFDRixVQUFNLFVBQVUsS0FBSyxLQUFLLFFBQVEsSUFBSSxHQUFHLE1BQU07QUFDL0MsUUFBSSxHQUFHLFdBQVcsT0FBTyxHQUFHO0FBQzFCLFlBQU0sVUFBVSxHQUFHLGFBQWEsU0FBUyxNQUFNO0FBQy9DLFlBQU0sUUFBUSxRQUFRLE1BQU0sSUFBSTtBQUNoQyxpQkFBVyxRQUFRLE9BQU87QUFDeEIsY0FBTSxVQUFVLEtBQUssS0FBSztBQUMxQixZQUFJLFdBQVcsQ0FBQyxRQUFRLFdBQVcsR0FB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QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQXFNaUIsY0FBYztBQUFBO0FBQUE7QUFBQTtBQUFBLHlDQUlkLElBQUksS0FBSyxN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Q1IsdUJBQXVCO0FBQUEsTUFDdkIsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sYUFBYSxJQUFJO0FBQ2YsZ0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQixrQkFBSSxHQUFHLFNBQVMsT0FBTyxHQUFHO0FBQ3hCLHVCQUFPO0FBQUEsY0FDVDtBQUNBLGtCQUFJLEdBQUcsU0FBUyxNQUFNLEdBQUc7QUFDdkIsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLE9BQU8sR0FBRztBQUN4Qix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxrQkFBSSxHQUFHLFNBQVMsV0FBVyxLQUFLLEdBQUcsU0FBUyxXQUFXLEdBQUc7QUFDeEQsdUJBQU87QUFBQSxjQUNUO0FBQ0Esa0JBQUksR0FBRyxTQUFTLGNBQWMsR0FBRztBQUMvQix1QkFBTztBQUFBLGNBQ1Q7QUFDQSxxQkFBTztBQUFBLFlBQ1Q7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbImZzIiwgInBhdGgiLCAibG9hZEVudkZhbGxiYWNrIiwgInBhdGgiLCAiZnMiLCAiZ2V0UmVxdWVzdEJvZHkiLCAic2VuZFJlc3BvbnNlIiwgImhhbmRsZXIiLCAiZnMiLCAicGF0aCIsICJsb2FkRW52RmFsbGJhY2siLCAicGF0aCIsICJmcyIsICJnZXRSZXF1ZXN0Qm9keSIsICJzZW5kUmVzcG9uc2UiLCAiaGFuZGxlciIsICJmcyIsICJwYXRoIiwgImxvYWRFbnZGYWxsYmFjayIsICJwYXRoIiwgImZzIiwgImdldFJlcXVlc3RCb2R5IiwgInNlbmRSZXNwb25zZSIsICJoYW5kbGVyIiwgIm5vZGVtYWlsZXIiLCAiZnMiLCAicGF0aCIsICJsb2FkRW52RmFsbGJhY2siLCAicGF0aCIsICJmcyIsICJnZXRSZXF1ZXN0Qm9keSIsICJzZW5kUmVzcG9uc2UiLCAiaGFuZGxlciIsICJDbGllbnQiLCAibm9kZW1haWxlciIsICJoYW5kbGVyIl0KfQo=
