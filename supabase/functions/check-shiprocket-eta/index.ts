// supabase/functions/check-shiprocket-eta/index.ts
// Serviceability check with Shiprocket ETA (Estimated Time of Delivery) API

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

let cachedToken: string | null = null;
let tokenExpiresAt = 0;
let authBlockedUntil = 0;

function getFallbackEstimate(pincode: string) {
  const pinStr = String(pincode || "").trim();
  const pinNum = parseInt(pinStr, 10);
  if (isNaN(pinNum) || pinStr.length !== 6 || pinNum < 100000 || pinNum > 999999) {
    return { serviceable: false, error: "Invalid pincode. Must be a 6-digit number." };
  }

  if (pinStr.startsWith("67") || pinStr.startsWith("68") || pinStr.startsWith("69")) {
    return { serviceable: true, delivery_days: "1 to 3", courier_name: "Express Local Courier" };
  }
  if (pinStr.startsWith("5") || pinStr.startsWith("6")) {
    return { serviceable: true, delivery_days: "2 to 4", courier_name: "Express Regional Courier" };
  }
  return { serviceable: true, delivery_days: "3 to 5", courier_name: "Standard National Express" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let pincode = "";
  try {
    const body = await req.json().catch(() => ({}));
    pincode = String(body.pincode || "").trim();

    if (!pincode || pincode.length !== 6 || isNaN(Number(pincode))) {
      return new Response(
        JSON.stringify({ serviceable: false, error: "Invalid pincode. Must be a 6-digit number." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const srEmail = Deno.env.get("SHIPROCKET_EMAIL");
    const srPassword = Deno.env.get("SHIPROCKET_PASSWORD");
    const pickupPostcode = "670001"; // Default pickup postcode for Soshka in Kannur, Kerala

    if (!srEmail || !srPassword) {
      return new Response(
        JSON.stringify(getFallbackEstimate(pincode)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = Date.now();
    if (now < authBlockedUntil) {
      return new Response(
        JSON.stringify(getFallbackEstimate(pincode)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let token = cachedToken;
    if (!token || now >= tokenExpiresAt) {
      const authRes = await fetch("https://apiv2.shiprocket.in/v1/external/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: srEmail, password: srPassword }),
      });

      if (!authRes.ok) {
        authBlockedUntil = now + 15 * 60 * 1000;
        return new Response(
          JSON.stringify(getFallbackEstimate(pincode)),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authData = await authRes.json();
      token = authData.token;
      if (token) {
        cachedToken = token;
        tokenExpiresAt = now + 24 * 60 * 60 * 1000;
      }
    }

    if (!token) {
      return new Response(
        JSON.stringify(getFallbackEstimate(pincode)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Shiprocket Courier Serviceability / ETA API
    const serviceabilityUrl = `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPostcode}&delivery_postcode=${pincode}&weight=0.5&cod=1`;

    const servRes = await fetch(serviceabilityUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!servRes.ok) {
      if (servRes.status === 401) {
        cachedToken = null;
        tokenExpiresAt = 0;
      }
      return new Response(
        JSON.stringify(getFallbackEstimate(pincode)),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const servData = await servRes.json();
    const courierList = servData?.data?.available_courier_companies || [];

    if (courierList.length === 0) {
      return new Response(
        JSON.stringify({ serviceable: false, message: "Delivery not available to this pincode." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validCouriers = courierList
      .filter((c: any) => c.estimated_delivery_days !== undefined || c.etd !== undefined)
      .map((c: any) => {
        let days = parseInt(c.estimated_delivery_days || "0", 10);
        if (days === 0 && c.etd) {
          const etdDate = new Date(c.etd).getTime();
          const today = new Date().getTime();
          const diffMs = etdDate - today;
          days = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        }
        return {
          courier_name: c.courier_name || c.name || "Express Courier",
          delivery_days: days,
        };
      })
      .sort((a: any, b: any) => a.delivery_days - b.delivery_days);

    if (validCouriers.length === 0) {
      return new Response(
        JSON.stringify({ serviceable: false, message: "Delivery not available to this pincode." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fastestCourier = validCouriers[0];
    const minDays = fastestCourier.delivery_days || 3;
    const maxDays = minDays + 2;

    return new Response(
      JSON.stringify({
        serviceable: true,
        delivery_days: `${minDays} to ${maxDays}`,
        courier_name: fastestCourier.courier_name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify(getFallbackEstimate(pincode || "670001")),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
