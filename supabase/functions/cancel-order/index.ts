// @ts-nocheck
// supabase/functions/cancel-order/index.ts
// Secure server-side order cancellation and refund processing:
// 1. Authenticates user and checks permissions (owner or admin).
// 2. Validates cancellation constraints: Prepaid only, within 1 hour of payment, not already shipped/delivered.
// 3. Invokes the Razorpay Refund API.
// 4. Invokes the Shiprocket Cancellation API (if shipment exists).
// 5. Updates orders table and inserts an audit record in the refunds table.
// 6. Sends a branded cancellation confirmation email.

import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function formatINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
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

function getDisplayOrderId(orderId: string): string {
  if (orderId.startsWith("00000000-0000-0000-0000-")) {
    return orderId.split("-").pop() ?? orderId.slice(0, 8).toUpperCase();
  }
  return orderId.slice(0, 8).toUpperCase();
}

// ── Branded Cancellation Email Template ──────────────────────────────────────

function buildCancellationEmailHtml(order: any, displayOrderId: string, refundId: string | null): string {
  const items = order.items || [];
  const dateStr = new Date(order.created_at || new Date()).toLocaleDateString("en-IN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const itemsHtml = items.map((item: any) => `
    <tr>
      <td style="padding:12px 8px; border-bottom:1px solid #f3e8ee; font-size:13px; color:#2d1b22;">
        <strong>${item.name}</strong>${item.size ? ` <span style="color:#be185d;font-size:11px;"> · Size: ${item.size}</span>` : ""}
      </td>
      <td style="padding:12px 8px; border-bottom:1px solid #f3e8ee; font-size:13px; color:#6b2244; text-align:center;">${item.quantity}</td>
      <td style="padding:12px 8px; border-bottom:1px solid #f3e8ee; font-size:13px; color:#2d1b22; text-align:right; font-weight:700;">${formatINR(item.price * item.quantity)}</td>
    </tr>`).join("");

  const isCod = order.payment_method === "cod";
  const bodyText = isCod
    ? `Your Cash on Delivery order <strong>#${displayOrderId}</strong> has been cancelled successfully. Since this was a Cash on Delivery order, no amount was charged and no refund is required.`
    : `Your order <strong>#${displayOrderId}</strong> has been cancelled successfully. The refund (with a 2% gateway processing fee deducted) has been initiated to your original payment method and will be credited to your account within 5–7 business days.`;

  const infoBoxHtml = isCod
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border:1px dashed #e5e7eb;border-radius:12px;padding:16px;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#4b5563;padding-bottom:8px;"><strong>Payment Method:</strong></td>
                <td style="font-size:13px;color:#374151;font-weight:700;text-align:right;padding-bottom:8px;">Cash on Delivery</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding-bottom:8px;"><strong>Order Total:</strong></td>
                <td style="font-size:14px;color:#b91c1c;font-weight:800;text-align:right;padding-bottom:8px;">${formatINR(order.total)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;"><strong>Cancellation Status:</strong></td>
                <td style="font-size:13px;color:#047857;font-weight:700;text-align:right;">Completed</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
    : `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;background:#f9fafb;border:1px dashed #e5e7eb;border-radius:12px;padding:16px;">
        <tr>
          <td>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:13px;color:#4b5563;padding-bottom:8px;"><strong>Order Total:</strong></td>
                <td style="font-size:13px;color:#374151;text-align:right;padding-bottom:8px;">${formatINR(order.total)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding-bottom:8px;"><strong>Deduction (2% Fee):</strong></td>
                <td style="font-size:13px;color:#b91c1c;text-align:right;padding-bottom:8px;">-${formatINR(order.total * 0.02)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding-bottom:8px;"><strong>Refund Amount:</strong></td>
                <td style="font-size:14px;color:#047857;font-weight:800;text-align:right;padding-bottom:8px;">${formatINR(order.total * 0.98)}</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;padding-bottom:8px;"><strong>Refund Status:</strong></td>
                <td style="font-size:13px;color:#047857;font-weight:700;text-align:right;padding-bottom:8px;">Initiated</td>
              </tr>
              <tr>
                <td style="font-size:13px;color:#4b5563;"><strong>Refund ID:</strong></td>
                <td style="font-size:12px;color:#374151;font-family:monospace;text-align:right;">${refundId}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Order Has Been Cancelled – Soshka</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;color:#2d1b22;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:30px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.05);border:1px solid #e0e0e0;">

        <!-- HEADER -->
        <tr>
          <td style="background:linear-gradient(135deg,#374151 0%,#1f2937 100%);padding:36px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:32px;letter-spacing:6px;font-weight:800;text-transform:uppercase;">SOSHKA</h1>
            <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Fine Jewellery</p>
          </td>
        </tr>

        <!-- CANCELLATION BANNER -->
        <tr>
          <td style="background:linear-gradient(to right, #fef2f2, #fff5f5);padding:28px 40px;text-align:center;border-bottom:2px solid #fee2e2;">
            <div style="display:inline-block;background:#fee2e2;border:1.5px solid #fca5a5;border-radius:50px;padding:8px 22px;margin-bottom:14px;">
              <span style="color:#991b1b;font-size:12px;font-weight:900;letter-spacing:1px;">⚠️ ORDER CANCELLED</span>
            </div>
            <h2 style="margin:0 0 8px;color:#991b1b;font-size:22px;font-weight:900;">Your order has been cancelled</h2>
            <p style="margin:0;color:#7f1d1d;font-size:13px;">Order Number: <strong style="font-family:monospace;font-size:15px;color:#991b1b;">#${displayOrderId}</strong> · Placed on ${dateStr}</p>
          </td>
        </tr>

        <!-- BODY -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;">
              Hello ${order.shipping_address?.name ?? "Customer"},<br><br>
              ${bodyText}
            </p>

            <!-- Info Box -->
            ${infoBoxHtml}

            <!-- Items table -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
              <thead>
                <tr style="background:#f3f4f6;">
                  <th style="padding:12px 8px;color:#374151;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:left;">Cancelled Item</th>
                  <th style="padding:12px 8px;color:#374151;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:center;">Qty</th>
                  <th style="padding:12px 8px;color:#374151;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;text-align:right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Help box -->
            <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#374151;font-weight:700;">Need assistance or have questions?</p>
              <p style="margin:6px 0 0;font-size:11px;color:#6b7280;">Visit our store or email us at <a href="mailto:soshka.in@gmail.com" style="color:#3b82f6;font-weight:700;">soshka.in@gmail.com</a></p>
            </div>

          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#1f2937;padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Soshka Store</p>
            <p style="margin:8px 0 0;font-size:10px;color:#6b7280;">© ${new Date().getFullYear()} Soshka Store · www.soshka.in</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
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

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized — missing header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const orderId = body.orderId || body.order_id;
    const cancellationReason = body.reason || body.cancellation_reason || "Cancelled by customer within 1 hour window";

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Authenticate the user calling this function
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized — invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verify user ownership or Admin privilege
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const isAdmin = profile && ["admin", "superadmin"].includes(profile.role);

    if (order.user_id !== user.id && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: You do not own this order." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Verify prepaid payment status
    // COD is now supported, so we no longer block it here

    // 5. Recheck the 1-hour cancellation window on the server (based on paid_at or created_at)
    const paidAtTime = order.paid_at ? new Date(order.paid_at).getTime() : new Date(order.created_at).getTime();
    const nowTime = new Date().getTime();
    const diffHours = (nowTime - paidAtTime) / (1000 * 60 * 60);

    if (diffHours > 1) {
      return new Response(
        JSON.stringify({ error: "Cancellation window expired. Orders can only be cancelled within 1 hour of placement/payment." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Verify order is not already cancelled or refunded
    if (order.order_status === "cancelled" || order.status === "cancelled") {
      return new Response(
        JSON.stringify({ error: "Order is already cancelled." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (order.refund_status && order.refund_status !== "none") {
      return new Response(
        JSON.stringify({ error: "Refund has already been initiated or completed." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Verify order has not been shipped or delivered
    const allowedStatuses = ["pending", "confirmed", "processing", "paid"];
    const currentStatus = order.order_status || order.status || "pending";
    if (!allowedStatuses.includes(currentStatus)) {
      return new Response(
        JSON.stringify({ error: `Cancellation not allowed. Order status is '${currentStatus}'.` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Call Razorpay Refund API (Prepaid only)
    let rpRefund = null;
    let paymentId = null;
    let refundErrorMsg = null;

    if (order.payment_method !== "cod") {
      paymentId = order.razorpay_payment_id || order.payment_id;
      if (!paymentId) {
        console.warn("Prepaid order is missing payment details. Marking for manual refund.");
        refundErrorMsg = "Missing payment details. Manual refund required.";
      } else {
        try {
          const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
          const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
          const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
          const refundAmount = Number(order.total) * 0.98;
          const amountInPaise = Math.round(refundAmount * 100);

          console.log(`Initiating Razorpay Refund for payment: ${paymentId}, amount: ${amountInPaise} paise (2% deducted: order total ${order.total} -> refund amount ${refundAmount})`);
          const rpRefundRes = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}/refund`, {
            method: "POST",
            headers: {
              Authorization: `Basic ${auth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              amount: amountInPaise,
              speed: "normal",
              notes: {
                reason: "Customer cancelled within one hour",
              },
            }),
          });

          if (!rpRefundRes.ok) {
            const rpErr = await rpRefundRes.json();
            console.error("Razorpay refund failed:", rpErr);
            refundErrorMsg = rpErr.error?.description || "Razorpay API error";
          } else {
            rpRefund = await rpRefundRes.json();
            console.log("Razorpay Refund initiated successfully:", rpRefund.id);
          }
        } catch (err: any) {
          console.error("Failed to connect to Razorpay:", err.message);
          refundErrorMsg = err.message || "Connection error to Razorpay";
        }
      }
    }

    // 9. Call Shiprocket Cancel API if shipment exists
    if (order.shiprocket_order_id) {
      try {
        const srEmail = Deno.env.get("SHIPROCKET_EMAIL")!;
        const srPassword = Deno.env.get("SHIPROCKET_PASSWORD")!;

        const srAuthRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: srEmail, password: srPassword }),
        });

        if (srAuthRes.ok) {
          const { token } = await srAuthRes.json();
          const srOrderId = parseInt(order.shiprocket_order_id, 10);

          if (!isNaN(srOrderId)) {
            console.log(`Cancelling Shiprocket order ID: ${srOrderId}`);
            const srCancelRes = await fetch("https://apiv2.shiprocket.in/v1/external/orders/cancel", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ ids: [srOrderId] }),
            });

            if (!srCancelRes.ok) {
              console.warn("Shiprocket cancellation failed:", await srCancelRes.text());
            } else {
              console.log("Shiprocket cancellation success");
            }
          }
        }
      } catch (srErr) {
        console.error("Shiprocket cancel error:", srErr);
      }
    }

    // 10. Update Database
    const isProcessedImmediately = rpRefund ? rpRefund.status === "processed" : false;
    const initialRefundStatus = order.payment_method === "cod"
      ? "none"
      : (refundErrorMsg
          ? "failed"
          : (isProcessedImmediately ? "completed" : "processing"));
    const initialPaymentStatus = order.payment_method === "cod"
      ? "pending"
      : (isProcessedImmediately ? "refunded" : "paid");

    // A. Update orders table
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        status: "cancelled", // legacy fallback
        order_status: "cancelled",
        payment_status: initialPaymentStatus,
        refund_status: initialRefundStatus,
        refund_id: rpRefund ? rpRefund.id : null,
        refund_amount: order.payment_method === "cod" ? 0 : (Number(order.total) * 0.98),
        cancelled_at: new Date().toISOString(),
        refund_processed_at: (order.payment_method !== "cod" && isProcessedImmediately) ? new Date().toISOString() : null,
        cancellation_reason: cancellationReason || refundErrorMsg || "Customer Cancelled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order status:", updateError.message);
      return new Response(
        JSON.stringify({ error: `Failed to update order in database: ${updateError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // B. Insert into refunds table (Prepaid only)
    if (order.payment_method !== "cod") {
      const { error: insertRefundErr } = await supabase
        .from("refunds")
        .insert({
          order_id: order.id,
          payment_id: paymentId || "unknown",
          razorpay_refund_id: rpRefund ? rpRefund.id : "failed_refund",
          amount: Number(order.total) * 0.98,
          status: initialRefundStatus,
          reason: cancellationReason || refundErrorMsg || "Customer Cancelled",
          created_at: new Date().toISOString(),
          completed_at: isProcessedImmediately ? new Date().toISOString() : null,
          raw_response: rpRefund || { error: refundErrorMsg },
        });

      if (insertRefundErr) {
        console.error("Failed to log in refunds table:", insertRefundErr.message);
      }
    }

    // 11. Send Cancellation Email
    let customerEmail: string | null = order.shipping_address?.email ?? null;

    if (!customerEmail && order.user_id) {
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", order.user_id)
        .single();
      if (userProfile?.email) customerEmail = userProfile.email;
    }

    if (!customerEmail) {
      const { data: adminUserData } = await supabase.auth.admin.getUserById(order.user_id);
      if (adminUserData?.user?.email) customerEmail = adminUserData.user.email;
    }

    if (customerEmail) {
      try {
        const smtpHost = Deno.env.get("SMTP_HOST") ?? "smtp.gmail.com";
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") ?? "587", 10);
        const smtpUser = Deno.env.get("SMTP_USER");
        const smtpPass = Deno.env.get("SMTP_PASS");

        if (smtpUser && smtpPass) {
          const displayOrderId = getDisplayOrderId(order.id);
          const htmlContent = buildCancellationEmailHtml(order, displayOrderId, rpRefund ? rpRefund.id : null);
          const subject = `Your Order Has Been Cancelled – Invoice #${displayOrderId} | Soshka`;
          
          const isCod = order.payment_method === "cod";
          const plainText = isCod
            ? `Hello ${order.shipping_address?.name ?? "Customer"},\n\nYour Cash on Delivery order #${displayOrderId} has been cancelled successfully.\n\nOrder Details:\nPayment Method: Cash on Delivery\nOrder Total: ${formatINR(order.total)}\nCancellation Status: Completed\n\nThank you,\nSoshka`
            : `Hello ${order.shipping_address?.name ?? "Customer"},\n\nYour order #${displayOrderId} has been cancelled successfully.\n\nRefund Details:\nOrder Total: ${formatINR(order.total)}\nDeduction (2% Processing Fee): ${formatINR(order.total * 0.02)}\nRefund Amount: ${formatINR(order.total * 0.98)}\nRefund Status: Initiated\nRefund ID: ${rpRefund ? rpRefund.id : ""}\n\nThe refund will be credited to your original payment method in 5-7 business days.\n\nThank you,\nSoshka`;

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
              "Precedence": "bulk",
            },
          });
          console.log(`Sent cancellation email to ${customerEmail}`);

          if (customerEmail !== "soshka.in@gmail.com") {
            try {
              const adminSubject = `Order Cancelled - #${displayOrderId} | Soshka Admin Alert`;
              const adminHtmlContent = buildAdminCancelAlertEmailHtml(order, displayOrderId);
              const adminPlainText = `Order Cancelled: #${displayOrderId}\nTotal: ${formatINR(order.total)}`;

              await transporter.sendMail({
                from: `"Soshka System" <${smtpUser}>`,
                to: "soshka.in@gmail.com",
                replyTo: customerEmail,
                subject: adminSubject,
                text: adminPlainText,
                html: adminHtmlContent,
              });
              console.log(`Sent admin cancellation alert to soshka.in@gmail.com for #${displayOrderId}`);
            } catch (adminMailErr) {
              console.error("Failed to send admin cancellation notification:", adminMailErr);
            }
          }
        } else {
          console.warn("SMTP credentials not configured. Skipping email.");
        }
      } catch (emailErr) {
        console.error("Email delivery failed:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Order cancelled successfully." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error in cancel-order handler:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
