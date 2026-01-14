import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-TICKET-PAYMENT] ${step}${detailsStr}`);
};

const sendConfirmationEmail = async (
  email: string,
  ticketId: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventLocation: string,
  quantity: number,
  amountPaid: number,
  currency: string
) => {
  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    logStep("RESEND_API_KEY not set, skipping email");
    return;
  }

  const resend = new Resend(resendKey);
  const ticketNumber = ticketId.slice(0, 8).toUpperCase();
  const formattedAmount = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amountPaid / 100);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  try {
    await resend.emails.send({
      from: "MyEcclesia <tickets@myecclesia.org.uk>",
      to: [email],
      subject: `🎟️ Your Ticket for ${eventTitle}`,
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
                <h1 style="color: #6366f1; margin: 0;">🎟️ Ticket Confirmed!</h1>
              </div>
              
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 12px; margin-bottom: 30px;">
                <h2 style="margin: 0 0 20px 0; font-size: 24px;">${eventTitle}</h2>
                <div style="display: grid; gap: 15px;">
                  <div>
                    <strong>📅 Date:</strong> ${formatDate(eventDate)}
                  </div>
                  <div>
                    <strong>🕐 Time:</strong> ${eventTime}
                  </div>
                  <div>
                    <strong>📍 Location:</strong> ${eventLocation}
                  </div>
                  <div>
                    <strong>🎫 Quantity:</strong> ${quantity} ticket${quantity > 1 ? 's' : ''}
                  </div>
                  <div>
                    <strong>💳 Amount Paid:</strong> ${formattedAmount}
                  </div>
                </div>
              </div>
              
              <div style="background-color: #f0fdf4; border: 2px solid #22c55e; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; color: #666;">Your Ticket Number</p>
                <p style="font-size: 28px; font-weight: bold; color: #22c55e; margin: 0; letter-spacing: 2px;">${ticketNumber}</p>
              </div>
              
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://myecclesia.lovable.app/my-tickets" style="display: inline-block; background-color: #6366f1; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600;">View My Tickets</a>
              </div>
              
              <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>Thank you for your purchase!</p>
                <p style="margin: 0;">MyEcclesia - Connecting Christians through faith and community</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });
    logStep("Confirmation email sent", { email, ticketNumber });
  } catch (error) {
    logStep("Error sending email", { error: error instanceof Error ? error.message : String(error) });
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    // Get user from auth header
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
    }

    if (!user) {
      throw new Error("Authentication required");
    }

    const { sessionId } = await req.json();
    logStep("Request received", { sessionId, userId: user.id });

    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    logStep("Stripe session retrieved", { 
      status: session.payment_status,
      metadata: session.metadata 
    });

    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    const metadata = session.metadata || {};
    const eventId = metadata.event_id;
    const eventSlug = metadata.event_slug;
    const quantity = parseInt(metadata.quantity || "1");
    const ticketTypeId = metadata.ticket_type_id || null;

    if (!eventId && !eventSlug) {
      throw new Error("Event information not found in session");
    }

    // Check if ticket already exists for this session
    const { data: existingTicket } = await supabaseService
      .from("tickets")
      .select("id")
      .eq("payment_id", session.id)
      .single();

    if (existingTicket) {
      logStep("Ticket already exists", { ticketId: existingTicket.id });
      return new Response(JSON.stringify({ 
        success: true, 
        ticketId: existingTicket.id,
        message: "Ticket already created" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get the actual event ID if we only have slug
    let actualEventId = eventId;
    if (!actualEventId && eventSlug) {
      const { data: eventData } = await supabaseService
        .from("events")
        .select("id")
        .eq("slug", eventSlug)
        .single();
      
      if (eventData) {
        actualEventId = eventData.id;
      }
    }

    if (!actualEventId) {
      throw new Error("Event not found");
    }

    // Create the ticket
    const { data: ticket, error: ticketError } = await supabaseService
      .from("tickets")
      .insert({
        event_id: actualEventId,
        user_id: user.id,
        quantity,
        status: "confirmed",
        payment_id: session.id,
        ticket_type_id: ticketTypeId,
        payment_metadata: {
          stripe_session_id: session.id,
          amount_total: session.amount_total,
          currency: session.currency,
          customer_email: session.customer_details?.email,
          event_title: metadata.event_title,
          event_date: metadata.event_date,
          event_time: metadata.event_time,
          event_location: metadata.event_location,
        },
      })
      .select()
      .single();

    if (ticketError) {
      logStep("Error creating ticket", { error: ticketError.message });
      throw ticketError;
    }

    logStep("Ticket created", { ticketId: ticket.id });

    // Also create event registration
    const { error: regError } = await supabaseService
      .from("event_registrations")
      .upsert({
        event_id: actualEventId,
        user_id: user.id,
        status: "registered",
      }, {
        onConflict: "event_id,user_id",
      });

    if (regError) {
      logStep("Warning: Could not create registration", { error: regError.message });
    }

    // Update ticket_types quantity_sold if applicable
    if (ticketTypeId) {
      await supabaseService.rpc("increment_ticket_sold", {
        p_ticket_type_id: ticketTypeId,
        p_quantity: quantity,
      }).catch(e => {
        logStep("Warning: Could not update quantity_sold", { error: e.message });
      });
    }

    // Send confirmation email
    const customerEmail = session.customer_details?.email || user.email;
    if (customerEmail) {
      await sendConfirmationEmail(
        customerEmail,
        ticket.id,
        metadata.event_title || "Event",
        metadata.event_date || "",
        metadata.event_time || "",
        metadata.event_location || "",
        quantity,
        session.amount_total || 0,
        session.currency || "gbp"
      );
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticket.id,
      message: "Ticket created successfully" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
