// @ts-nocheck
// supabase/functions/send-order-email/index.ts
// Sends a branded HTML order confirmation email via Gmail SMTP (nodemailer)
// Fully distinct email per payment method: COD vs Online Payment
// Called server-side after order creation — guarantees delivery regardless of frontend state

import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value || 0);
}

function formatDateTime(dateVal: any): string {
  try {
    const d = new Date(dateVal || new Date());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss} (UTC)`;
  } catch (_) {
    return "N/A";
  }
}

function formatDateOnly(dateVal: any): string {
  try {
    const d = new Date(dateVal || new Date());
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch (_) {
    return "N/A";
  }
}

function getDisplayOrderId(orderId: string): string {
  if (orderId.startsWith("00000000-0000-0000-0000-")) {
    return orderId.split("-").pop() ?? orderId.slice(0, 8).toUpperCase();
  }
  return orderId.slice(0, 8).toUpperCase();
}

// ── Shared HTML fragments ─────────────────────────────────────────────────────

function buildItemsTableHtml(items: any[]): string {
  const rows = items.map((item: any) => `
    <tr>
      <td style="padding:13px 10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#2d1b22;">
        <strong style="display:block;color:#1a0a10;">${item.name}</strong>
        ${item.size ? `<span style="font-size:10px;color:#be185d;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Size: ${item.size}</span>` : ""}
      </td>
      <td style="padding:13px 10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#9f1239;font-weight:800;text-align:center;">${item.quantity}</td>
      <td style="padding:13px 10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#1a0a10;font-weight:800;text-align:right;">${formatINR(item.price * item.quantity)}</td>
    </tr>`).join("");

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:12px;overflow:hidden;border:1px solid #fce7f0;">
      <thead>
        <tr style="background:linear-gradient(90deg,#9f1239,#be185d);">
          <th style="padding:12px 10px;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:left;">Product</th>
          <th style="padding:12px 10px;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qty</th>
          <th style="padding:12px 10px;color:#fff;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function buildTotalsHtml(subtotal: number, codFee: number, total: number, isCOD: boolean): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;background:#fdf2f8;border-radius:12px;padding:16px;border:1px solid #fce7f0;">
      <tr>
        <td style="padding:5px 0;font-size:12px;color:#6b2244;">Subtotal</td>
        <td style="padding:5px 0;font-size:12px;color:#2d1b22;font-weight:600;text-align:right;">${formatINR(subtotal)}</td>
      </tr>
      ${codFee > 0 ? `
      <tr>
        <td style="padding:5px 0;font-size:12px;color:#6b2244;">COD Handling Fee</td>
        <td style="padding:5px 0;font-size:12px;color:#b45309;font-weight:700;text-align:right;">${formatINR(codFee)}</td>
      </tr>` : ""}
      <tr>
        <td colspan="2" style="padding:10px 0 2px;"><hr style="border:none;border-top:2px solid #fce7f0;margin:0;"></td>
      </tr>
      <tr>
        <td style="padding:8px 0 4px;font-size:15px;font-weight:900;color:#9f1239;text-transform:uppercase;letter-spacing:1px;">${isCOD ? "Total to Pay on Delivery" : "Total Amount Paid"}</td>
        <td style="padding:8px 0 4px;font-size:22px;font-weight:900;color:#9f1239;text-align:right;">${formatINR(total)}</td>
      </tr>
    </table>`;
}

function buildAddressHtml(address: any): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:16px;">
          <p style="margin:0 0 6px;font-size:10px;font-weight:800;color:#be185d;letter-spacing:2px;text-transform:uppercase;">Bill To</p>
          <p style="margin:0;font-size:14px;font-weight:700;color:#1a0a10;">${address?.name ?? ""}</p>
          <p style="margin:3px 0 0;font-size:12px;color:#6b2244;">${address?.phone ?? ""}</p>
          ${address?.email ? `<p style="margin:3px 0 0;font-size:12px;color:#6b2244;">${address.email}</p>` : ""}
        </td>
        <td style="width:50%;vertical-align:top;text-align:right;">
          <p style="margin:0 0 6px;font-size:10px;font-weight:800;color:#be185d;letter-spacing:2px;text-transform:uppercase;">Deliver To</p>
          <p style="margin:0;font-size:12px;color:#2d1b22;font-weight:600;line-height:1.6;">
            ${address?.addressLine ?? ""}<br>
            ${address?.city ?? ""}, ${address?.state ?? ""} – ${address?.postalCode ?? ""}
          </p>
        </td>
      </tr>
    </table>`;
}

function sharedHeader(): string {
  return `
    <tr>
      <td style="background:linear-gradient(135deg,#9f1239 0%,#be185d 60%,#db2777 100%);padding:36px 40px;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:32px;letter-spacing:6px;font-weight:800;text-transform:uppercase;">SÕSHKA</h1>
        <p style="margin:6px 0 0;color:#fce7f0;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Fine Jewellery</p>
      </td>
    </tr>`;
}

function sharedFooter(): string {
  return `
    <tr>
      <td style="background:linear-gradient(135deg,#9f1239,#be185d);padding:24px 40px;text-align:center;">
        <p style="margin:0;color:#fce7f0;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Thank you for shopping with Sõshka</p>
        <p style="margin:8px 0 4px;font-size:11px;color:#fbcfe8;">Need help? <a href="mailto:soshka.in@gmail.com" style="color:#ffffff;font-weight:700;">soshka.in@gmail.com</a></p>
        <p style="margin:6px 0 0;font-size:10px;color:#fbcfe8;">© ${new Date().getFullYear()} Sõshka Store · www.soshka.in</p>
      </td>
    </tr>`;
}

// ── COD Email Template ────────────────────────────────────────────────────────

function buildCODEmailHtml(order: any, displayOrderId: string): string {
  const items = order.items || [];
  const subtotal = order.subtotal ?? items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const codFee = Number(order.cod_fee ?? 60);
  const dateStr = new Date(order.created_at || new Date()).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Confirmed – Cash on Delivery | Sõshka</title>
</head>
<body style="margin:0;padding:0;background:#fffbf0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2d1b22;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbf0;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(159,18,57,0.08);border:1px solid #fce7f0;">

        ${sharedHeader()}

        <!-- ── COD BANNER ── -->
        <tr>
          <td style="background:#fdf2f8;padding:28px 40px;text-align:center;border-bottom:2px solid #fce7f0;">
            <div style="display:inline-block;background:#fef3c7;border:1.5px solid #fbbf24;border-radius:50px;padding:8px 24px;margin-bottom:14px;">
              <span style="color:#92400e;font-size:13px;font-weight:800;letter-spacing:1px;">📦 CASH ON DELIVERY</span>
            </div>
            <h2 style="margin:0 0 8px;color:#9f1239;font-size:22px;font-weight:900;">Order Confirmed!</h2>
            <p style="margin:0 0 6px;color:#6b2244;font-size:14px;line-height:1.5;">
              You've selected <strong style="color:#b45309;">Cash on Delivery</strong> as your payment method.<br>
              Please keep <strong style="color:#9f1239;font-size:16px;">${formatINR(order.total)}</strong> ready at the time of delivery.
            </p>
            <p style="margin:10px 0 0;color:#9b6b00;font-size:12px;background:#fef9c3;border-radius:8px;padding:8px 14px;display:inline-block;">
              🕐 Our delivery partner will contact you before arriving at your doorstep.
            </p>
          </td>
        </tr>

        <!-- ── INVOICE DETAILS ── -->
        <tr>
          <td style="background:#fff7f0;padding:12px 40px;border-bottom:1px solid #fce7f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;color:#6b2244;font-weight:600;">Invoice No</td>
                <td style="font-size:11px;color:#6b2244;font-weight:600;">Date</td>
                <td style="font-size:11px;color:#6b2244;font-weight:600;text-align:right;">Payment</td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:900;color:#9f1239;font-family:monospace;">#${displayOrderId}</td>
                <td style="font-size:13px;font-weight:700;color:#2d1b22;">${dateStr}</td>
                <td style="font-size:12px;font-weight:800;color:#b45309;text-align:right;background:#fef3c7;padding:3px 10px;border-radius:6px;">Cash on Delivery</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:32px 40px;">

            ${buildAddressHtml(order.shipping_address)}
            ${buildItemsTableHtml(items)}
            ${buildTotalsHtml(subtotal, codFee, order.total, true)}

            <!-- COD instructions box -->
            <div style="background:#fffbeb;border:2px solid #fbbf24;border-radius:14px;padding:20px 22px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:900;color:#92400e;">📋 Cash on Delivery Instructions</p>
              <ul style="margin:0;padding-left:18px;font-size:12px;color:#78350f;line-height:2;">
                <li>Keep exact cash of <strong>${formatINR(order.total)}</strong> ready (includes ₹${codFee} COD handling fee)</li>
                <li>Our delivery partner will call you before arriving</li>
                <li>Inspect the package before handing over the payment</li>
                <li>For any issues, contact us before accepting delivery</li>
              </ul>
            </div>

            <!-- Guarantee -->
            <div style="background:#fdf2f8;border:1px solid #fce7f0;border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9f1239;font-weight:700;">🛡️ Boutique Guarantee — 100% Genuine Handpicked Essentials</p>
              <p style="margin:6px 0 0;font-size:11px;color:#6b2244;">Questions? <a href="mailto:soshka.in@gmail.com" style="color:#be185d;font-weight:700;">soshka.in@gmail.com</a></p>
            </div>

          </td>
        </tr>

        ${sharedFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Online Payment (Razorpay) Email Template ──────────────────────────────────

function buildOnlinePaymentEmailHtml(order: any, displayOrderId: string): string {
  const items = order.items || [];
  const subtotal = order.subtotal ?? items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const dateStr = new Date(order.created_at || new Date()).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Payment Confirmed | Sõshka</title>
</head>
<body style="margin:0;padding:0;background:#f0fdf9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2d1b22;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf9;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(5,150,105,0.10);border:1px solid #d1fae5;">

        ${sharedHeader()}

        <!-- ── PAYMENT SUCCESS BANNER ── -->
        <tr>
          <td style="background:#f0fdf4;padding:28px 40px;text-align:center;border-bottom:2px solid #d1fae5;">
            <div style="display:inline-block;background:#ecfdf5;border:1.5px solid #34d399;border-radius:50px;padding:8px 24px;margin-bottom:14px;">
              <span style="color:#065f46;font-size:13px;font-weight:800;letter-spacing:1px;">✅ PAYMENT SUCCESSFUL</span>
            </div>
            <h2 style="margin:0 0 8px;color:#9f1239;font-size:22px;font-weight:900;">Payment Received!</h2>
            <p style="margin:0 0 6px;color:#064e3b;font-size:14px;line-height:1.5;">
              Your payment of <strong style="color:#047857;font-size:16px;">${formatINR(order.total)}</strong> has been <strong>confirmed</strong>.<br>
              Your order is now being prepared for dispatch.
            </p>
            <p style="margin:10px 0 0;color:#065f46;font-size:12px;background:#d1fae5;border-radius:8px;padding:8px 14px;display:inline-block;">
              🚀 You will receive a shipping tracking update once dispatched.
            </p>
          </td>
        </tr>

        <!-- ── INVOICE DETAILS ── -->
        <tr>
          <td style="background:#f0fdf4;padding:12px 40px;border-bottom:1px solid #d1fae5;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;color:#047857;font-weight:600;">Invoice No</td>
                <td style="font-size:11px;color:#047857;font-weight:600;">Date</td>
                <td style="font-size:11px;color:#047857;font-weight:600;text-align:right;">Payment</td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:900;color:#9f1239;font-family:monospace;">#${displayOrderId}</td>
                <td style="font-size:13px;font-weight:700;color:#2d1b22;">${dateStr}</td>
                <td style="font-size:12px;font-weight:800;color:#065f46;text-align:right;background:#d1fae5;padding:3px 10px;border-radius:6px;">Online — Paid ✓</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:32px 40px;">

            ${buildAddressHtml(order.shipping_address)}
            ${buildItemsTableHtml(items)}
            ${buildTotalsHtml(subtotal, 0, order.total, false)}

            <!-- What happens next -->
            <div style="background:#f0fdf4;border:2px solid #6ee7b7;border-radius:14px;padding:20px 22px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:900;color:#065f46;">🚚 What Happens Next?</p>
              <ol style="margin:0;padding-left:18px;font-size:12px;color:#047857;line-height:2.1;">
                <li><strong>Payment confirmed</strong> — your order is now in our system ✓</li>
                <li><strong>Order processing</strong> — our team is picking and packing your item(s)</li>
                <li><strong>Dispatched</strong> — you'll receive a tracking link via email/SMS</li>
                <li><strong>Delivered</strong> — at your doorstep, no payment needed on delivery</li>
              </ol>
            </div>

            <!-- Razorpay payment note -->
            <div style="background:#ede9fe;border:1px solid #c4b5fd;border-radius:10px;padding:14px 18px;margin-bottom:24px;font-size:12px;color:#4c1d95;">
              <strong>💳 Secure Payment:</strong> Your payment was processed securely via Razorpay. 
              You should receive a payment receipt from Razorpay separately.
            </div>

            <!-- Guarantee -->
            <div style="background:#fdf2f8;border:1px solid #fce7f0;border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9f1239;font-weight:700;">🛡️ Boutique Guarantee — 100% Genuine Handpicked Essentials</p>
              <p style="margin:6px 0 0;font-size:11px;color:#6b2244;">Questions? <a href="mailto:soshka.in@gmail.com" style="color:#be185d;font-weight:700;">soshka.in@gmail.com</a></p>
            </div>

          </td>
        </tr>

        ${sharedFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Cancellation Email Template ─────────────────────────────────────────────

function buildCancellationEmailHtml(order: any, displayOrderId: string): string {
  const items = order.items || [];
  const subtotal = order.subtotal ?? items.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
  const isCOD = order.payment_method === "cod";
  const isPrepaid = !isCOD;
  const dateStr = new Date(order.created_at || new Date()).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Order Cancelled | Sõshka</title>
</head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2d1b22;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(220,38,38,0.08);border:1px solid #fee2e2;">

        ${sharedHeader()}

        <!-- ── CANCELLATION BANNER ── -->
        <tr>
          <td style="background:#fff1f2;padding:28px 40px;text-align:center;border-bottom:2px solid #fee2e2;">
            <div style="display:inline-block;background:#fee2e2;border:1.5px solid #fca5a5;border-radius:50px;padding:8px 24px;margin-bottom:14px;">
              <span style="color:#991b1b;font-size:13px;font-weight:800;letter-spacing:1px;">❌ ORDER CANCELLED</span>
            </div>
            <h2 style="margin:0 0 8px;color:#9f1239;font-size:22px;font-weight:900;">Your Order Has Been Cancelled</h2>
            <p style="margin:0 0 6px;color:#7f1d1d;font-size:14px;line-height:1.5;">
              Order <strong style="color:#9f1239;font-family:monospace;">#${displayOrderId}</strong> placed on <strong>${dateStr}</strong> has been cancelled.
            </p>
            ${isPrepaid ? `
            <p style="margin:12px 0 0;color:#065f46;font-size:13px;background:#d1fae5;border-radius:8px;padding:10px 16px;display:inline-block;">
              💳 A full refund of <strong style="color:#047857;">${formatINR(order.total)}</strong> will be processed to your original payment method within <strong>5–7 business days</strong>.
            </p>` : `
            <p style="margin:12px 0 0;color:#92400e;font-size:13px;background:#fef3c7;border-radius:8px;padding:10px 16px;display:inline-block;">
              📦 Since this was a Cash on Delivery order, no payment has been charged.
            </p>`}
          </td>
        </tr>

        <!-- ── INVOICE DETAILS ── -->
        <tr>
          <td style="background:#fff1f2;padding:12px 40px;border-bottom:1px solid #fee2e2;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;color:#9f1239;font-weight:600;">Invoice No</td>
                <td style="font-size:11px;color:#9f1239;font-weight:600;">Date</td>
                <td style="font-size:11px;color:#9f1239;font-weight:600;text-align:right;">Status</td>
              </tr>
              <tr>
                <td style="font-size:14px;font-weight:900;color:#9f1239;font-family:monospace;">#${displayOrderId}</td>
                <td style="font-size:13px;font-weight:700;color:#2d1b22;">${dateStr}</td>
                <td style="font-size:12px;font-weight:800;color:#991b1b;text-align:right;background:#fee2e2;padding:3px 10px;border-radius:6px;">Cancelled ✕</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── BODY ── -->
        <tr>
          <td style="padding:32px 40px;">

            ${buildAddressHtml(order.shipping_address)}
            ${buildItemsTableHtml(items)}
            ${buildTotalsHtml(subtotal, isCOD ? Number(order.cod_fee ?? 60) : 0, order.total, isCOD)}

            <!-- Refund/next steps box -->
            <div style="background:#f0fdf4;border:2px solid #6ee7b7;border-radius:14px;padding:20px 22px;margin-bottom:24px;">
              <p style="margin:0 0 10px;font-size:14px;font-weight:900;color:#065f46;">${isPrepaid ? '💰 Refund Information' : '📋 What Happens Next?'}</p>
              ${isPrepaid ? `
              <ul style="margin:0;padding-left:18px;font-size:12px;color:#047857;line-height:2.1;">
                <li>Your refund of <strong>${formatINR(order.total)}</strong> has been initiated</li>
                <li>It will reflect in your original payment source within <strong>5–7 business days</strong></li>
                <li>You will receive a separate refund confirmation from Razorpay</li>
                <li>For questions, email us at <a href="mailto:soshka.in@gmail.com" style="color:#047857;">soshka.in@gmail.com</a></li>
              </ul>` : `
              <ul style="margin:0;padding-left:18px;font-size:12px;color:#047857;line-height:2.1;">
                <li>No payment was made — nothing will be charged</li>
                <li>Your order has been removed from our system</li>
                <li>Feel free to browse and place a new order anytime</li>
              </ul>`}
            </div>

            <!-- Apology note -->
            <div style="background:#fdf2f8;border:1px solid #fce7f0;border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9f1239;font-weight:700;">We're sorry to see this order cancelled.</p>
              <p style="margin:6px 0 0;font-size:11px;color:#6b2244;">Need help or have questions? <a href="mailto:soshka.in@gmail.com" style="color:#be185d;font-weight:700;">soshka.in@gmail.com</a></p>
            </div>

          </td>
        </tr>

        ${sharedFooter()}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildAdminAlertEmailHtml(order: any, displayOrderId: string): string {
  const items = order.items || [];
  const itemsRows = items.map((item: any) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#2d1b22;text-align:left;">
        <strong style="color:#1a0a10;">${item.name}</strong>
        ${item.size ? `<span style="font-size:10px;color:#be185d;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;">Size: ${item.size}</span>` : ""}
      </td>
      <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#9f1239;font-weight:850;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#1a0a10;font-weight:800;text-align:right;">${formatINR(item.price * item.quantity)}</td>
    </tr>
  `).join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Order Alert</title>
</head>
<body style="margin:0;padding:20px;background-color:#faf6f8;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #f3e8ee;">
    <div style="background:linear-gradient(90deg,#98183f,#db4268);padding:35px 20px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:1px;font-family:sans-serif;">New Order Placed!</h1>
      <p style="color:#fce7f0;margin:5px 0 0 0;font-size:14px;font-family:monospace;">Order ID: #${displayOrderId}</p>
    </div>
    
    <div style="padding:30px 24px;color:#2a0d18;line-height:1.6;">
      <h3 style="margin-top:0;color:#98183f;border-bottom:2px solid #f3e8ee;padding-bottom:8px;font-family:sans-serif;">Order Information</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;text-align:left;">Payment Method:</td>
          <td style="padding:8px 0;font-size:13px;font-weight:bold;text-transform:uppercase;text-align:right;">${order.payment_method}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;text-align:left;">Total Amount:</td>
          <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#98183f;text-align:right;">${formatINR(order.total)}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;text-align:left;">Placed At:</td>
          <td style="padding:8px 0;font-size:13px;text-align:right;">${formatDateTime(order.created_at)}</td>
        </tr>
      </table>

      <h3 style="color:#98183f;border-bottom:2px solid #f3e8ee;padding-bottom:8px;font-family:sans-serif;">Customer Details</h3>
      <p style="margin:0 0 4px;font-size:13px;font-weight:bold;">${order.shipping_address?.name ?? ""}</p>
      <p style="margin:0 0 4px;font-size:13px;">Phone: ${order.shipping_address?.phone ?? ""}</p>
      <p style="margin:0 0 4px;font-size:13px;">Email: ${order.shipping_address?.email ?? ""}</p>
      <p style="margin:0;font-size:13px;line-height:1.4;">
        Address: ${order.shipping_address?.addressLine ?? ""}, ${order.shipping_address?.city ?? ""}, ${order.shipping_address?.state ?? ""} - ${order.shipping_address?.postalCode ?? ""}
      </p>

      <h3 style="color:#98183f;border-bottom:2px solid #f3e8ee;padding-bottom:8px;margin-top:24px;font-family:sans-serif;">Items Summary</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr style="background-color:#faf6f8;">
            <th style="padding:10px;text-align:left;font-size:12px;color:#98183f;">Item</th>
            <th style="padding:10px;text-align:center;font-size:12px;color:#98183f;">Qty</th>
            <th style="padding:10px;text-align:right;font-size:12px;color:#98183f;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      
      <div style="margin-top:35px;text-align:center;">
        <a href="https://soshka.in/admin" style="background-color:#98183f;color:#ffffff;padding:12px 25px;text-decoration:none;font-weight:bold;border-radius:8px;font-size:14px;display:inline-block;">
          Go to Admin Panel
        </a>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function buildAdminCancelAlertEmailHtml(order: any, displayOrderId: string): string {
  const isCOD = order.payment_method === "cod";
  const items = order.items || [];
  const itemsRows = items.map((item: any) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#2d1b22;text-align:left;">
        <strong style="color:#1a0a10;">${item.name ?? "Product"}</strong>
        ${item.size ? `<span style="font-size:10px;color:#be185d;font-weight:700;text-transform:uppercase;letter-spacing:1px;display:block;">Size: ${item.size}</span>` : ""}
      </td>
      <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#9f1239;font-weight:850;text-align:center;">${item.quantity ?? 1}</td>
      <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-size:13px;color:#1a0a10;font-weight:800;text-align:right;">${formatINR(Number(item.price ?? 0) * Number(item.quantity ?? 1))}</td>
    </tr>
  `).join("");

  const refundDetails = !isCOD ? `
    <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:13px;font-weight:bold;color:#991b1b;">💰 Prepaid Refund Information</p>
      <table style="width:100%;font-size:12px;color:#7f1d1d;">
        <tr>
          <td>Paid Amount:</td>
          <td style="text-align:right;font-weight:bold;">${formatINR(order.total)}</td>
        </tr>
        <tr>
          <td>Processing Fee (2%):</td>
          <td style="text-align:right;font-weight:bold;">${formatINR(order.total * 0.02)}</td>
        </tr>
        <tr style="font-size:14px;font-weight:bold;color:#990000;">
          <td style="padding-top:6px;border-top:1px solid #fca5a5;">Refunded to Buyer (98%):</td>
          <td style="padding-top:6px;border-top:1px solid #fca5a5;text-align:right;">${formatINR(order.total * 0.98)}</td>
        </tr>
      </table>
    </div>
  ` : `
    <div style="background:#f3f4f6;border:1px solid #d1d5db;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;font-weight:bold;color:#374151;">📦 Cash on Delivery Order</p>
      <p style="margin:4px 0 0;font-size:12px;color:#4b5563;">Since this was a COD order, no payment gateway refund is required.</p>
    </div>
  `;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Order Cancelled Alert</title>
</head>
<body style="margin:0;padding:20px;background-color:#faf6f8;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #f3e8ee;">
    <div style="background:linear-gradient(90deg,#7f1d1d,#b91c1c);padding:35px 20px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:1px;font-family:sans-serif;">Order Cancelled Alert</h1>
      <p style="color:#fecaca;margin:5px 0 0 0;font-size:14px;font-family:monospace;">Order ID: #${displayOrderId}</p>
    </div>
    
    <div style="padding:30px 24px;color:#2a0d18;line-height:1.6;">
      ${refundDetails}

      <h3 style="margin-top:0;color:#991b1b;border-bottom:2px solid #f3e8ee;padding-bottom:8px;font-family:sans-serif;">Order Information</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;text-align:left;">Payment Method:</td>
          <td style="padding:8px 0;font-size:13px;font-weight:bold;text-transform:uppercase;text-align:right;">${order.payment_method ?? "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;text-align:left;">Total Amount:</td>
          <td style="padding:8px 0;font-size:16px;font-weight:bold;color:#991b1b;text-align:right;">${formatINR(Number(order.total ?? 0))}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:13px;color:#666;text-align:left;">Cancelled At:</td>
          <td style="padding:8px 0;font-size:13px;text-align:right;">${formatDateTime(new Date())}</td>
        </tr>
      </table>

      <h3 style="color:#991b1b;border-bottom:2px solid #f3e8ee;padding-bottom:8px;font-family:sans-serif;">Customer Details</h3>
      <p style="margin:0 0 4px;font-size:13px;font-weight:bold;">${order.shipping_address?.name ?? ""}</p>
      <p style="margin:0 0 4px;font-size:13px;">Phone: ${order.shipping_address?.phone ?? ""}</p>
      <p style="margin:0 0 4px;font-size:13px;">Email: ${order.shipping_address?.email ?? ""}</p>

      <h3 style="color:#991b1b;border-bottom:2px solid #f3e8ee;padding-bottom:8px;margin-top:24px;font-family:sans-serif;">Items Summary</h3>
      <table style="width:100%;border-collapse:collapse;margin-top:10px;">
        <thead>
          <tr style="background-color:#faf6f8;">
            <th style="padding:10px;text-align:left;font-size:12px;color:#991b1b;">Item</th>
            <th style="padding:10px;text-align:center;font-size:12px;color:#991b1b;">Qty</th>
            <th style="padding:10px;text-align:right;font-size:12px;color:#991b1b;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
  `;
}

// ── Handler ────────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { order_id, email_type } = await req.json();
    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch full order from DB using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Order fetch error:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isCancellation = email_type === "cancellation";
    const shippingAddressObj = order.shipping_address || {};

    if (isCancellation) {
      if (shippingAddressObj.cancellation_email_sent === true) {
        console.log(`[send-order-email] Cancellation email already sent for Order #${order_id}. Skipping.`);
        return new Response(JSON.stringify({ success: true, message: "Cancellation email already sent previously" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      if (shippingAddressObj.email_sent === true) {
        console.log(`[send-order-email] Confirmation email already sent for Order #${order_id}. Skipping.`);
        return new Response(JSON.stringify({ success: true, message: "Confirmation email already sent previously" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Resolve customer email: shipping_address → profiles table → auth.users
    let customerEmail: string | null = shippingAddressObj.email ?? null;

    if (!customerEmail && order.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", order.user_id)
        .single();
      if (profile?.email) customerEmail = profile.email;
    }

    if (!customerEmail) {
      const { data: adminUserData } = await supabase.auth.admin.getUserById(order.user_id);
      if (adminUserData?.user?.email) customerEmail = adminUserData.user.email;
    }

    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "Could not resolve customer email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SMTP credentials from Supabase secrets
    const smtpHost = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "587", 10);
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");

    if (!smtpUser || !smtpPass) {
      console.error("SMTP credentials not configured in Supabase secrets");
      return new Response(JSON.stringify({ error: "SMTP not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const displayOrderId = getDisplayOrderId(order.id);
    const isCOD = order.payment_method === "cod";

    // Choose template + subject based on email_type and payment method
    let htmlContent: string;
    let subject: string;
    let plainText: string;

    if (isCancellation) {
      htmlContent = buildCancellationEmailHtml(order, displayOrderId);
      subject = `Order Cancelled - #${displayOrderId} | Soshka`;
      plainText = `Your order #${displayOrderId} has been cancelled.\n\n${
        !isCOD
          ? `A full refund of ${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(order.total)} will be processed to your original payment method within 5-7 business days.`
          : `Since this was a Cash on Delivery order, no payment has been charged.`
      }\n\nFor questions, contact us at soshka.in@gmail.com\n\nThank you for shopping at Soshka.`;
    } else if (isCOD) {
      htmlContent = buildCODEmailHtml(order, displayOrderId);
      subject = `Order Confirmed (Cash on Delivery) - Invoice #${displayOrderId} | Soshka`;
      plainText = `Your COD order #${displayOrderId} is confirmed!\n\nTotal to pay on delivery: ${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(order.total)}\n\nPlease keep the exact amount ready. Our delivery partner will contact you before arriving.\n\nThank you for shopping at Soshka!`;
    } else {
      htmlContent = buildOnlinePaymentEmailHtml(order, displayOrderId);
      subject = `Payment Confirmed - Invoice #${displayOrderId} | Soshka`;
      plainText = `Payment Confirmed! Your order #${displayOrderId} is confirmed.\n\nTotal Paid: ${new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(order.total)}\n\nYour item(s) will be dispatched soon. Thank you for shopping at Soshka!`;
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"Soshka Jewellery" <${smtpUser}>`,
      to: customerEmail,
      replyTo: "soshka.in@gmail.com",
      subject,
      text: plainText,
      html: htmlContent,
      headers: {
        "X-Auto-Response-Suppress": "All",
        "Precedence": "bulk"
      }
    });

    if (customerEmail !== "soshka.in@gmail.com") {
      try {
        const adminSubject = isCancellation 
          ? `Order Cancelled - #${displayOrderId} | Soshka Admin Alert`
          : `New Order Placed - #${displayOrderId} | Soshka Admin Alert`;
        const adminHtmlContent = isCancellation
          ? buildAdminCancelAlertEmailHtml(order, displayOrderId)
          : buildAdminAlertEmailHtml(order, displayOrderId);
        const adminPlainText = isCancellation
          ? `Order Cancelled: #${displayOrderId}\nTotal: ${formatINR(order.total)}`
          : `New Order Placed: #${displayOrderId}\nTotal: ${formatINR(order.total)}\nPayment Method: ${order.payment_method.toUpperCase()}`;

        await transporter.sendMail({
          from: `"Soshka System" <${smtpUser}>`,
          to: "soshka.in@gmail.com",
          replyTo: customerEmail,
          subject: adminSubject,
          text: adminPlainText,
          html: adminHtmlContent,
        });
        console.log(`[send-order-email] Admin ${isCancellation ? 'cancellation' : 'new order'} email sent to soshka.in@gmail.com for Order #${displayOrderId}`);
      } catch (adminMailErr) {
        console.error("[send-order-email] Failed to send admin notification:", adminMailErr);
      }
    }

    const emailTypeLabel = isCancellation ? "Cancellation" : (isCOD ? "COD" : "Online");
    console.log(`[send-order-email] ${emailTypeLabel} email sent to ${customerEmail} — Order #${displayOrderId}`);

    // Write back email sent status to shipping_address jsonb to prevent duplicate sends (idempotency guard)
    const updatedAddress = {
      ...shippingAddressObj,
      [isCancellation ? "cancellation_email_sent" : "email_sent"]: true
    };
    await supabase
      .from("orders")
      .update({ shipping_address: updatedAddress })
      .eq("id", order_id);

    return new Response(JSON.stringify({ success: true, sent_to: customerEmail, method: isCancellation ? "cancellation" : (isCOD ? "cod" : "online") }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[send-order-email] Error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
