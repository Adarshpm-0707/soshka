// supabase/functions/send-contact-email/index.ts
import { createClient } from "npm:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false },
    });

    const subject = `New Contact Inquiry from ${name} | Soshka`;
    const plainText = `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`;
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Message</title>
</head>
<body style="margin:0;padding:20px;background-color:#faf6f8;font-family:sans-serif;">
  <div style="max-width:600px;margin:0 auto;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #f3e8ee;">
    <div style="background:linear-gradient(90deg,#98183f,#db4268);padding:30px 20px;text-align:center;">
      <h1 style="color:#ffffff;margin:0;font-size:24px;letter-spacing:1px;font-family:sans-serif;">Sõshka Jewellery</h1>
      <p style="color:#fce7f0;margin:5px 0 0 0;font-size:14px;">New Contact Form Submission</p>
    </div>
    <div style="padding:30px 24px;color:#2a0d18;line-height:1.6;">
      <p style="font-size:16px;margin-top:0;">You have received a new message from the Soshka Contact Page:</p>
      
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <tr>
          <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-weight:bold;color:#98183f;width:120px;">Name:</td>
          <td style="padding:10px;border-bottom:1px solid #f3e8ee;">${name}</td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-weight:bold;color:#98183f;">Email:</td>
          <td style="padding:10px;border-bottom:1px solid #f3e8ee;"><a href="mailto:${email}" style="color:#db4268;text-decoration:none;font-weight:600;">${email}</a></td>
        </tr>
        <tr>
          <td style="padding:10px;border-bottom:1px solid #f3e8ee;font-weight:bold;color:#98183f;vertical-align:top;">Message:</td>
          <td style="padding:10px;border-bottom:1px solid #f3e8ee;white-space:pre-wrap;">${message}</td>
        </tr>
      </table>
      
      <p style="font-size:12px;color:#888;margin-top:30px;border-top:1px solid #f3e8ee;padding-top:15px;text-align:center;">
        This email was sent automatically from soshka.in contact form.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    // Send email to Soshka (soshka.in@gmail.com)
    await transporter.sendMail({
      from: `"Soshka Contact Form" <${smtpUser}>`,
      to: "soshka.in@gmail.com",
      replyTo: email,
      subject,
      text: plainText,
      html: htmlContent,
    });

    console.log(`[send-contact-email] Message sent successfully from ${email}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[send-contact-email] Error:", err);
    return new Response(JSON.stringify({ error: err.message ?? "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
