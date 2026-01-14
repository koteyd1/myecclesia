import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-TICKET-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const resendKey = Deno.env.get("RESEND_API_KEY");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && signature) {
      // Verify webhook signature if secret is configured
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err) {
        logStep("Webhook signature verification failed", { error: err });
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else {
      // For testing without webhook secret
      event = JSON.parse(body);
    }

    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};

      logStep("Processing completed checkout", { sessionId: session.id, metadata });

      const userId = metadata.user_id;
      const eventId = metadata.event_id;
      const eventSlug = metadata.event_slug;
      const eventTitle = metadata.event_title;
      const eventDate = metadata.event_date;
      const eventTime = metadata.event_time;
      const eventLocation = metadata.event_location;
      const userEmail = metadata.user_email;
      const userName = metadata.user_name;
      const quantity = parseInt(metadata.quantity || "1");

      if (!userId || !eventId) {
        logStep("Missing required metadata", { userId, eventId });
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Create ticket record
      const { data: ticketData, error: ticketError } = await supabaseService
        .from("tickets")
        .insert({
          user_id: userId,
          event_id: eventId,
          payment_id: session.payment_intent as string,
          status: "confirmed",
          payment_metadata: {
            session_id: session.id,
            amount_total: session.amount_total,
            currency: session.currency,
            quantity,
          },
        })
        .select()
        .single();

      if (ticketError) {
        logStep("Error creating ticket", { error: ticketError });
        throw ticketError;
      }

      logStep("Ticket created", { ticketId: ticketData.id });

      // Also register user for the event
      const { error: regError } = await supabaseService
        .from("event_registrations")
        .upsert({
          user_id: userId,
          event_id: eventId,
          status: "registered",
        }, {
          onConflict: "user_id,event_id",
        });

      if (regError) {
        logStep("Warning: Could not create registration", { error: regError });
      }

      // Send confirmation email
      if (resendKey && userEmail) {
        try {
          const resend = new Resend(resendKey);
          
          const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : 'TBC';

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Ticket Confirmation</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #2563eb; margin: 0;">🎟️ Ticket Confirmed!</h1>
              </div>
              
              <p>Dear ${userName || 'Guest'},</p>
              
              <p>Thank you for your purchase! Your ticket${quantity > 1 ? 's have' : ' has'} been confirmed for:</p>
              
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 4px solid #2563eb;">
                <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 22px;">${eventTitle}</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748b; width: 100px;">📅 Date:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${formattedDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">🕐 Time:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${eventTime || 'TBC'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">📍 Location:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${eventLocation || 'TBC'}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748b;">🎫 Quantity:</td>
                    <td style="padding: 8px 0; font-weight: 600;">${quantity} ticket${quantity > 1 ? 's' : ''}</td>
                  </tr>
                </table>
              </div>
              
              <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;"><strong>📌 Important:</strong> Please save this email as your ticket confirmation. You may be asked to show it at the event.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://myecclesia.lovable.app/events/${eventSlug}" style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">View Event Details</a>
              </div>
              
              <p style="color: #64748b; font-size: 14px;">If you have any questions about the event, please contact the organizer directly.</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
              
              <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                This confirmation was sent from MyEcclesia<br>
                <a href="https://myecclesia.lovable.app" style="color: #2563eb;">myecclesia.lovable.app</a>
              </p>
            </body>
            </html>
          `;

          const emailResponse = await resend.emails.send({
            from: "MyEcclesia Tickets <tickets@myecclesia.org.uk>",
            to: [userEmail],
            subject: `🎟️ Ticket Confirmed - ${eventTitle}`,
            html: emailHtml,
          });

          logStep("Confirmation email sent", { emailId: emailResponse.data?.id });
        } catch (emailError) {
          logStep("Error sending confirmation email", { error: emailError });
          // Don't fail the webhook if email fails
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        ticketId: ticketData.id 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
