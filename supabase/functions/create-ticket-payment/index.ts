import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-TICKET-PAYMENT] ${step}${detailsStr}`);
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { eventId, eventTitle, price, quantity, buyerEmail, buyerName, eventDate, eventTime, eventLocation } = await req.json();
    logStep("Request received", { eventId, eventTitle, price, quantity, buyerEmail });

    // Get user from auth header
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
    }

    if (!user) {
      throw new Error("Authentication required to purchase tickets");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: buyerEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: buyerEmail,
        name: buyerName,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    logStep("Customer handled", { customerId });

    // Get event details from database for accurate info
    const { data: eventData } = await supabaseService
      .from("events")
      .select("id, title, date, time, location")
      .eq("slug", eventId)
      .single();

    const { ticketTypeId, ticketTypeName } = await req.json().catch(() => ({}));

    // Create checkout session for ticket purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: `Ticket: ${eventTitle}`,
              description: ticketTypeName ? `${ticketTypeName} - ${eventTitle}` : `Event ticket for ${eventTitle}`,
            },
            unit_amount: Math.round(price * 100), // Convert to pence
          },
          quantity: quantity || 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/events/${eventId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/events/${eventId}?payment=canceled`,
      metadata: {
        event_slug: eventId,
        event_id: eventData?.id || eventId,
        event_title: eventTitle,
        event_date: eventData?.date || eventDate || '',
        event_time: eventData?.time || eventTime || '',
        event_location: eventData?.location || eventLocation || '',
        user_id: user.id,
        user_email: buyerEmail,
        user_name: buyerName,
        quantity: String(quantity || 1),
        ticket_type_id: ticketTypeId || '',
        ticket_type_name: ticketTypeName || '',
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    return new Response(JSON.stringify({ url: session.url }), {
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
