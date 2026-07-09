// @ts-nocheck
// supabase/functions/create-cod-order/index.ts
// Secure server-side COD order creation with price recalculation and Shiprocket triggering

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

    // Create Supabase client with user's auth token to verify identity
    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized — invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    const cod_fee = 60;
    const shipping_fee = 0;
    const total = subtotal + shipping_fee + cod_fee;

    // === INSERT ORDER ROW IN DB (status=confirmed, payment_method=cod) ===
    // Generate a numeric-only UUID (00000000-0000-0000-0000- followed by 12 random base-10 digits)
    const customOrderId = `00000000-0000-0000-0000-${Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join("")}`;

    const { data: dbOrder, error: dbError } = await supabaseService
      .from("orders")
      .insert({
        id: customOrderId,
        user_id: user.id,
        items: enrichedItems,
        subtotal,
        shipping_fee,
        cod_fee,
        total,
        status: "confirmed",
        payment_status: "pending",
        order_status: "confirmed",
        payment_method: "cod",
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

    // === TRIGGER SHIPROCKET DISPATCH + ORDER CONFIRMATION EMAIL ===
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
          body: JSON.stringify({ order_id: dbOrder.id }),
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
          body: JSON.stringify({ order_id: dbOrder.id }),
        }).then(async (r) => {
          if (!r.ok) {
            console.error("Email trigger error response:", await r.text());
          } else {
            console.log("Email trigger success:", await r.json());
          }
        })
      ]);
    } catch (err) {
      console.error("Post-order tasks failed:", err);
    }

    return new Response(
      JSON.stringify({
        success: true,
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
