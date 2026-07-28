// @ts-nocheck
// supabase/functions/create-shiprocket-order/index.ts
// Triggered by verify-razorpay-payment after successful payment.
// Idempotent: skips if shiprocket_order_id already set on the order row.

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
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: "order_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the order
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (fetchError || !order) {
      console.error("Order not found:", fetchError?.message);
      return new Response(
        JSON.stringify({ error: "Order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only process paid orders (for prepaid) or confirmed orders (for COD)
    if (order.status !== "paid" && order.status !== "confirmed") {
      console.error(`Order ${order_id} is in status ${order.status} — must be paid or confirmed`);
      return new Response(
        JSON.stringify({ error: `Order is not paid and not confirmed (status: ${order.status})` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === IDEMPOTENCY CHECK ===
    if (order.shiprocket_order_id) {
      console.log(`Order ${order_id} already has shiprocket_order_id ${order.shiprocket_order_id} — skipping`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, shiprocket_order_id: order.shiprocket_order_id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { shipping_address, items, total, created_at } = order;

    // Filter out test orders
    const orderEmail = ((shipping_address as any)?.email || "").toLowerCase();
    const orderName = ((shipping_address as any)?.name || "").toLowerCase();
    const orderIdStr = String(order_id).toLowerCase();

    if (
      orderEmail.includes("test@") ||
      orderEmail.includes("example.com") ||
      orderName.includes("test customer") ||
      orderIdStr.includes("test")
    ) {
      console.log(`Excluding test order ${order_id} (${orderEmail}) from Shiprocket.`);
      return new Response(
        JSON.stringify({ success: false, skipped: true, error: "Test orders are excluded from Shiprocket." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === AUTHENTICATE WITH SHIPROCKET ===
    const srEmail = Deno.env.get("SHIPROCKET_EMAIL")!;
    const srPassword = Deno.env.get("SHIPROCKET_PASSWORD")!;
    const pickupLocation = Deno.env.get("SHIPROCKET_PICKUP_LOCATION") || "warehouse";
    const channelId = Deno.env.get("SHIPROCKET_CHANNEL_ID") || "11188787";

    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: srEmail, password: srPassword }),
    });

    if (!authRes.ok) {
      const authErr = await authRes.json();
      throw new Error(`Shiprocket auth failed: ${authErr.message || authRes.statusText}`);
    }

    const { token } = await authRes.json();

    // Format order date
    const orderDate = new Date(created_at || Date.now())
      .toISOString()
      .replace("T", " ")
      .slice(0, 16);

    // Split name
    const nameParts = ((shipping_address as any).name || "Customer").trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || ".";

    // Format items
    const orderItems = (items as any[]).map((item: any, idx: number) => ({
      name: item.name || `Item ${idx + 1}`,
      sku: item.product_id ? String(item.product_id).slice(0, 8) : `SKU-${idx}`,
      units: parseInt(item.quantity ?? 1, 10),
      selling_price: parseFloat(item.price ?? 0),
    }));

    const addr = shipping_address as any;

    const displayOrderId = order_id.startsWith("00000000-0000-0000-0000-")
      ? `SOSHKA-${order_id.split("-").pop()!}`
      : `SOSHKA-${order_id.slice(0, 8).toUpperCase()}`;

    const payload = {
      order_id: displayOrderId,
      order_date: orderDate,
      pickup_location: pickupLocation,
      ...(channelId ? { channel_id: parseInt(channelId, 10) } : {}),
      billing_customer_name: firstName,
      billing_last_name: lastName,
      billing_address: addr.addressLine || addr.address || "Address",
      billing_city: addr.city || "City",
      billing_pincode: parseInt(addr.postalCode || "110001", 10),
      billing_state: addr.state || "State",
      billing_country: "India",
      billing_email: addr.email || "customer@soshka.in",
      billing_phone: (addr.phone || "9876543210").replace(/[^0-9]/g, ""),
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: order.payment_method === "cod" ? "COD" : "Prepaid",
      sub_total: parseFloat(total ?? 0),
      length: 10,
      breadth: 10,
      height: 5,
      weight: 0.2,
    };

    // === CREATE SHIPROCKET ORDER ===
    const createRes = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Shiprocket order creation failed: ${errText}`);
    }

    const createData = await createRes.json();
    console.log("Shiprocket order created:", JSON.stringify(createData));

    // Extract shipment_id
    let shipmentId: string | null = null;
    let awbCode = "";

    if (createData.shipment_id) {
      shipmentId = String(createData.shipment_id);
      awbCode = createData.awb_code || "";
    } else if (createData.data?.shipment_id) {
      shipmentId = String(createData.data.shipment_id);
      awbCode = createData.data.awb_code || "";
    } else if (Array.isArray(createData.data?.data) && createData.data.data[0]) {
      shipmentId = String(createData.data.data[0].shipment_id);
      awbCode = createData.data.data[0].awb_code || "";
    } else if (Array.isArray(createData.data) && createData.data[0]) {
      shipmentId = String(createData.data[0].shipment_id);
      awbCode = createData.data[0].awb_code || "";
    }

    if (!shipmentId) {
      throw new Error(`Shiprocket did not return a shipment ID. Response: ${JSON.stringify(createData)}`);
    }

    // === ASSIGN AWB CODE ===
    if (!awbCode && shipmentId) {
      console.log(`Assigning AWB code for shipment: ${shipmentId}...`);
      try {
        const awbRes = await fetch(
          "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ shipment_id: parseInt(shipmentId, 10) }),
          }
        );
        const awbData = await awbRes.json();
        console.log("Shiprocket AWB assignment response:", JSON.stringify(awbData));
        if (awbData.response?.data?.awb_code) {
          awbCode = String(awbData.response.data.awb_code);
        } else if (awbData.awb_code) {
          awbCode = String(awbData.awb_code);
        }
      } catch (awbErr) {
        console.warn("Shiprocket AWB assignment warning:", awbErr);
      }
    }

    // === SCHEDULE PICKUP ===
    const pickupRes = await fetch(
      "https://apiv2.shiprocket.in/v1/external/courier/generate/pickup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: [parseInt(shipmentId, 10)] }),
      }
    );

    if (!pickupRes.ok) {
      const pickupErr = await pickupRes.text();
      console.warn("Pickup scheduling warning:", pickupErr);
    } else {
      const pickupData = await pickupRes.json();
      console.log("Pickup scheduled:", JSON.stringify(pickupData));
    }

    // === UPDATE ORDER WITH SHIPROCKET IDs ===
    const shiprocketOrderId = createData.order_id || shipmentId;
    await supabase
      .from("orders")
      .update({
        shiprocket_order_id: String(shiprocketOrderId),
        shiprocket_awb: awbCode,
        shiprocket_shipment_id: shipmentId,
        status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    return new Response(
      JSON.stringify({
        success: true,
        shipment_id: shipmentId,
        awb_code: awbCode,
        shiprocket_order_id: shiprocketOrderId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Shiprocket edge function error:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
