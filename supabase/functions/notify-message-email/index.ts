import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.log("[NOTIFY-MESSAGE] RESEND_API_KEY not set, skipping email");
      return new Response(JSON.stringify({ success: false, reason: "no_api_key" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { recipientId, senderName, subject, contentPreview } = await req.json();

    if (!recipientId) {
      throw new Error("recipientId is required");
    }

    // Get recipient's email from profiles
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", recipientId)
      .single();

    if (!profile?.email) {
      console.log("[NOTIFY-MESSAGE] No email found for recipient");
      return new Response(JSON.stringify({ success: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recipientName = profile.full_name || "there";
    const displaySubject = subject || "New Message";
    // Strip markdown formatting for email preview
    const cleanPreview = (contentPreview || "")
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .slice(0, 300);

    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: "MyEcclesia <notifications@myecclesia.org.uk>",
      to: [profile.email],
      subject: `💬 ${displaySubject}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #6366f1; margin: 0; font-size: 22px;">You have a new message</h1>
              </div>
              
              <div style="background-color: #f8f9fa; padding: 24px; border-radius: 12px; border-left: 4px solid #6366f1; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; font-size: 14px; color: #888;">From <strong style="color: #333;">${senderName || "Someone"}</strong></p>
                ${displaySubject !== "New Message" ? `<p style="margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #333;">${displaySubject}</p>` : ""}
                <p style="margin: 0; font-size: 14px; color: #555; line-height: 1.6;">${cleanPreview}${cleanPreview.length >= 300 ? "..." : ""}</p>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://myecclesia.lovable.app/messages" style="display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">View Message</a>
              </div>
              
              <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #999; font-size: 12px;">
                <p style="margin: 0;">MyEcclesia — Connecting Christians through faith and community</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log("[NOTIFY-MESSAGE] Email sent to", profile.email);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[NOTIFY-MESSAGE] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
