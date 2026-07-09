// supabase/functions/check-shiprocket-eta/index.ts
// Serviceability check with Shiprocket ETA (Estimated Time of Delivery) API

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { pincode } = await req.json();
    if (!pincode || String(pincode).trim().length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid pincode. Must be a 6-digit number." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const srEmail = Deno.env.get("SHIPROCKET_EMAIL")!;
    const srPassword = Deno.env.get("SHIPROCKET_PASSWORD")!;
    const pickupPostcode = "670001"; // Default pickup postcode for Soshka in Kannur, Kerala

    if (!srEmail || !srPassword) {
      console.error("Missing Shiprocket credentials in Deno environment.");
      return new Response(
        JSON.stringify({ error: "Shiprocket integration is not configured." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Authenticate with Shiprocket
    const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: srEmail, password: srPassword }),
    });

    if (!authRes.ok) {
      const authErr = await authRes.json();
      console.error("Shiprocket authentication failed:", authErr);
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with Shiprocket." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token } = await authRes.json();

    // 2. Call Shiprocket Courier Serviceability / ETA API
    const serviceabilityUrl = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${pincode}&weight=0.5&cod=1`;
    console.log(`Checking Shiprocket serviceability: ${serviceabilityUrl}`);

    const servRes = await fetch(serviceabilityUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!servRes.ok) {
      const servErrText = await servRes.text();
      console.error("Shiprocket serviceability API returned error:", servErrText);
      return new Response(
        JSON.stringify({ serviceable: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const servData = await servRes.json();
    console.log("Shiprocket serviceability response:", JSON.stringify(servData));

    const courierList = servData?.data?.available_courier_companies || [];
    if (courierList.length === 0) {
      return new Response(
        JSON.stringify({ serviceable: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Pick the courier with the fastest Estimated Delivery days (etd / estimated_delivery_days)
    // We filter list where estimated_delivery_days is present
    const validCouriers = courierList
      .filter((c: any) => c.estimated_delivery_days !== undefined || c.etd !== undefined)
      .map((c: any) => {
        let days = parseInt(c.estimated_delivery_days || "0", 10);
        if (days === 0 && c.etd) {
          // calculate days from current date to ETD
          const etdDate = new Date(c.etd).getTime();
          const today = new Date().getTime();
          const diffMs = etdDate - today;
          days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
        return {
          courier_name: c.courier_name || c.name,
          delivery_days: days,
        };
      })
      .sort((a: any, b: any) => a.delivery_days - b.delivery_days);

    if (validCouriers.length === 0) {
      return new Response(
        JSON.stringify({ serviceable: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fastestCourier = validCouriers[0];
    
    // Add margin to delivery estimate (e.g. if fastest is 3, return "3-5" days)
    const minDays = fastestCourier.delivery_days;
    const maxDays = minDays + 2;

    return new Response(
      JSON.stringify({
        serviceable: true,
        delivery_days: `${minDays} to ${maxDays}`,
        courier_name: fastestCourier.courier_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Unexpected error in check-shiprocket-eta:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
