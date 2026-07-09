// @ts-nocheck
// supabase/functions/razorpay-webhook/index.ts
// Secure webhook listener for Razorpay refund events:
// 1. Verifies HMAC-SHA256 signature using RAZORPAY_WEBHOOK_SECRET.
// 2. Processes refund.processed and refund.failed events.
// 3. Updates public.refunds and public.orders tables.

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-razorpay-signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("x-razorpay-signature");
    if (!signature) {
      console.error("Missing x-razorpay-signature header");
      return new Response(JSON.stringify({ error: "Unauthorized — Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
    if (!secret) {
      console.error("RAZORPAY_WEBHOOK_SECRET secret is not configured in Supabase");
      return new Response(JSON.stringify({ error: "Server Configuration Error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read the raw request body as text for signature verification
    const rawBody = await req.text();

    // Verify HMAC-SHA256 signature
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(rawBody)
    );
    const expectedSignature = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== signature) {
      console.error("Signature mismatch!", { expectedSignature, signature });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the verified JSON payload
    const eventData = JSON.parse(rawBody);
    const { event, payload } = eventData;

    console.log(`Received Razorpay webhook event: ${event}`);

    if (event !== "refund.processed" && event !== "refund.failed") {
      console.log(`Skipping unhandled event type: ${event}`);
      return new Response(JSON.stringify({ success: true, message: "Event ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refundEntity = payload.refund?.entity;
    if (!refundEntity) {
      console.error("Payload is missing refund entity");
      return new Response(JSON.stringify({ error: "Invalid payload layout" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const razorpayRefundId = refundEntity.id;       // rfnd_...
    const paymentId = refundEntity.payment_id;       // pay_...
    const amount = Number(refundEntity.amount) / 100; // in INR (converted from paise)

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (event === "refund.processed") {
      console.log(`Processing refund.processed for refund ID: ${razorpayRefundId}, payment ID: ${paymentId}`);

      // 1. Update refunds table
      const { data: updatedRefunds, error: refundErr } = await supabase
        .from("refunds")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          raw_response: refundEntity,
        })
        .eq("razorpay_refund_id", razorpayRefundId)
        .select();

      if (refundErr) {
        console.error("Failed to update refunds table:", refundErr.message);
      } else {
        console.log(`Updated refunds table rows:`, updatedRefunds?.length);
      }

      // 2. Update orders table
      const { data: updatedOrders, error: orderErr } = await supabase
        .from("orders")
        .update({
          payment_status: "refunded",
          refund_status: "completed",
          refund_processed_at: new Date().toISOString(),
          refund_id: razorpayRefundId,
          refund_amount: amount,
        })
        .or(`refund_id.eq.${razorpayRefundId},payment_id.eq.${paymentId},razorpay_payment_id.eq.${paymentId}`)
        .select();

      if (orderErr) {
        console.error("Failed to update orders table:", orderErr.message);
      } else {
        console.log(`Updated orders table rows:`, updatedOrders?.length);
      }
    } else if (event === "refund.failed") {
      console.log(`Processing refund.failed for refund ID: ${razorpayRefundId}, payment ID: ${paymentId}`);

      // 1. Update refunds table
      const { error: refundErr } = await supabase
        .from("refunds")
        .update({
          status: "failed",
          raw_response: refundEntity,
        })
        .eq("razorpay_refund_id", razorpayRefundId);

      if (refundErr) {
        console.error("Failed to update refunds table:", refundErr.message);
      }

      // 2. Update orders table
      const { error: orderErr } = await supabase
        .from("orders")
        .update({
          refund_status: "failed",
          refund_id: razorpayRefundId,
        })
        .or(`refund_id.eq.${razorpayRefundId},payment_id.eq.${paymentId},razorpay_payment_id.eq.${paymentId}`);

      if (orderErr) {
        console.error("Failed to update orders table:", orderErr.message);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
