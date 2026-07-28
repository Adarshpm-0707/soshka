// @ts-nocheck
// supabase/functions/create-razorpay-order/index.ts
// Secure server-side Razorpay order creation with server-side price recalculation

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
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

    // Parse request body: { items: [{product_id, qty, size}], shipping_address: {...} }
    const { items, shipping_address } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: "Items are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!shipping_address) {
      return new Response(JSON.stringify({ error: "Shipping address is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let userId = null;
    if (authHeader && authHeader !== 'Bearer null' && authHeader !== 'Bearer undefined') {
      try {
        const supabaseUser = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } }
        );
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (user) {
          userId = user.id;
        }
      } catch (_) {
        userId = null;
      }
    }

    // Create service-role client for DB writes (bypasses RLS)
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // === SERVER-SIDE PRICE RECALCULATION ===
    let subtotal = 0;
    const enrichedItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await supabaseService
        .from("products")
        .select("id, name, price, original_price, offer_price, images, stock")
        .eq("id", item.product_id)
        .single();

      if (productError || !product) {
        return new Response(
          JSON.stringify({ error: `Product not found: ${item.product_id}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const stock = parseInt(product.stock ?? 0, 10);
      const qty = parseInt(item.qty ?? item.quantity ?? 1, 10);

      if (stock < qty) {
        return new Response(
          JSON.stringify({ error: `Insufficient stock for product: ${product.name} (Only ${stock} units available)` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const originalPrice = Number(product.original_price ?? product.price ?? 0);
      const offerPrice = Number(product.offer_price ?? 0);
      const unitPrice = offerPrice > 0 ? offerPrice : originalPrice;
      subtotal += unitPrice * qty;

      enrichedItems.push({
        product_id: product.id,
        name: product.name,
        price: unitPrice,
        quantity: qty,
        size: item.size || "",
        image: product.images?.[0] || "",
      });
    }
    // Calculate shipping (disabled)
    const shipping_fee = 0;
    const total = subtotal;
    const amountPaise = Math.round(total * 100);

    // === CREATE RAZORPAY ORDER ===
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    const auth = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);

    const rpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
        payment_capture: 1,
      }),
    });

    if (!rpRes.ok) {
      const rpErr = await rpRes.json();
      console.error("Razorpay order creation failed:", rpErr);
      return new Response(
        JSON.stringify({ error: `Razorpay error: ${rpErr.error?.description || "Order creation failed"}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rpOrder = await rpRes.json();

    // === INSERT ORDER ROW IN DB (status=pending) ===
    // Generate a numeric-only UUID (00000000-0000-0000-0000- followed by 12 random base-10 digits)
    const customOrderId = `00000000-0000-0000-0000-${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("")}`;

    const { data: dbOrder, error: dbError } = await supabaseService
      .from("orders")
      .insert({
        id: customOrderId,
        user_id: userId,
        items: enrichedItems,
        subtotal,
        shipping_fee,
        total,
        status: "pending",
        payment_status: "pending",
        order_status: "pending",
        razorpay_order_id: rpOrder.id,
        order_id: rpOrder.id,
        shipping_address,
      })
      .select()
      .single();

    if (dbError || !dbOrder) {
      console.error("DB insert error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to create order record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        order_id: rpOrder.id,
        amount: rpOrder.amount,
        key_id: razorpayKeyId,
        db_order_id: dbOrder.id,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
