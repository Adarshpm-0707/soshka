// @ts-nocheck
// supabase/functions/verify-razorpay-payment/index.ts
// Verifies Razorpay HMAC signature, marks order as paid, triggers Shiprocket

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      db_order_id,
    } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !db_order_id) {
      return new Response(
        JSON.stringify({ error: "Missing required payment verification fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user session
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

    // === HMAC SIGNATURE VERIFICATION (using Deno native Web Crypto API) ===
    const secret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

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
      new TextEncoder().encode(body)
    );
    const expectedSig = Array.from(new Uint8Array(sigBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSig !== razorpay_signature) {
      console.error("Signature mismatch!", { expectedSig, razorpay_signature });
      return new Response(
        JSON.stringify({ success: false, error: "Payment signature verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === UPDATE ORDER TO PAID (idempotent) ===
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: updatedOrder, error: updateError } = await supabaseService
      .from("orders")
      .update({
        status: "paid",
        payment_status: "paid",
        order_status: "confirmed",
        paid_at: new Date().toISOString(),
        razorpay_payment_id,
        payment_id: razorpay_payment_id,
        razorpay_signature,
        order_id: razorpay_order_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", db_order_id)
      .eq("razorpay_order_id", razorpay_order_id)
      .eq("user_id", user.id)
      .neq("payment_status", "paid") // idempotency guard using new column
      .select()
      .single();

    if (updateError) {
      console.warn("Order update warning:", updateError.message);
    }

    // === TRIGGER SHIPROCKET + ORDER CONFIRMATION EMAIL ===
    if (updatedOrder) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

      try {
        await Promise.allSettled([
          fetch(`${supabaseUrl}/functions/v1/create-shiprocket-order`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ order_id: db_order_id }),
          }).then(async (r) => {
            if (!r.ok) {
              console.error("Shiprocket trigger error response:", await r.text());
            } else {
              console.log("Shiprocket trigger success:", await r.json());
            }
          }),
          fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({ order_id: db_order_id }),
          }).then(async (r) => {
            if (!r.ok) {
              console.error("Email trigger error response:", await r.text());
            } else {
              console.log("Email trigger success:", await r.json());
            }
          })
        ]);
      } catch (err) {
        console.error("Post-payment tasks failed:", err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, order_id: db_order_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
