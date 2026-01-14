import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "npm:qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[HANDLE-TICKET-WEBHOOK] ${step}${detailsStr}`);
};

// Generate QR code as base64 data URL
const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    logStep("Error generating QR code", { error });
    return '';
  }
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

      // Send confirmation email with QR code
      if (resendKey && userEmail) {
        try {
          const resend = new Resend(resendKey);
          
          // Generate QR code with ticket verification data
          const qrData = JSON.stringify({
            ticketId: ticketData.id,
            eventId: eventId,
            userId: userId,
            eventTitle: eventTitle,
            quantity: quantity,
            verifyUrl: `https://myecclesia.lovable.app/verify-ticket/${ticketData.id}`
          });
          
          const qrCodeDataUrl = await generateQRCode(qrData);
          logStep("QR code generated", { hasQRCode: !!qrCodeDataUrl });
          
          const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }) : 'TBC';

          const ticketNumber = ticketData.id.slice(0, 8).toUpperCase();

          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Ticket Confirmation</title>
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
              <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px;">🎟️ Ticket Confirmed!</h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Thank you for your purchase</p>
                </div>
                
                <div style="padding: 30px;">
                  <p style="margin: 0 0 20px 0;">Dear ${userName || 'Guest'},</p>
                  
                  <p style="margin: 0 0 25px 0;">Your ticket${quantity > 1 ? 's have' : ' has'} been confirmed. Please present this QR code at the event for check-in.</p>
                  
                  <!-- QR Code Section -->
                  <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                    <div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                      ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 180px; height: 180px; display: block;" />` : '<p style="color: #64748b;">QR Code</p>'}
                    </div>
                    <p style="color: #1e40af; font-weight: 600; margin: 15px 0 5px 0; font-size: 14px;">TICKET #${ticketNumber}</p>
                    <p style="color: #64748b; font-size: 12px; margin: 0;">Scan this code at check-in</p>
                  </div>
                  
                  <!-- Event Details -->
                  <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e2e8f0;">
                    <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 20px;">${eventTitle}</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; width: 40px; vertical-align: top;">📅</td>
                        <td style="padding: 10px 0;">
                          <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Date</span><br>
                          <span style="font-weight: 600; color: #1e293b;">${formattedDate}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; vertical-align: top;">🕐</td>
                        <td style="padding: 10px 0;">
                          <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Time</span><br>
                          <span style="font-weight: 600; color: #1e293b;">${eventTime || 'TBC'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; vertical-align: top;">📍</td>
                        <td style="padding: 10px 0;">
                          <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Location</span><br>
                          <span style="font-weight: 600; color: #1e293b;">${eventLocation || 'TBC'}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0; color: #64748b; vertical-align: top;">🎫</td>
                        <td style="padding: 10px 0;">
                          <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Tickets</span><br>
                          <span style="font-weight: 600; color: #1e293b;">${quantity} ticket${quantity > 1 ? 's' : ''}</span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Important Notice -->
                  <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                    <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>📌 Important:</strong> Please save this email or take a screenshot of the QR code. You may be asked to present it at the event entrance.</p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://myecclesia.lovable.app/events/${eventSlug}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">View Event Details</a>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">If you have any questions about the event, please contact the organizer directly.</p>
                </div>
                
                <!-- Footer -->
                <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                    This confirmation was sent from MyEcclesia<br>
                    <a href="https://myecclesia.lovable.app" style="color: #2563eb;">myecclesia.lovable.app</a>
                  </p>
                </div>
              </div>
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
