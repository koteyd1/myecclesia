import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { eventId, eventSlug, eventTitle, price, quantity, buyerEmail, buyerName } = await req.json();
    logStep("Request received", { eventId, eventSlug, eventTitle, price, quantity, buyerEmail });

    // Get user from auth header
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseService.auth.getUser(token);
      user = userData.user;
    }

    if (!user) {
      throw new Error("Authentication required to purchase tickets");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

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

    // Create checkout session for ticket purchase
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: `Ticket: ${eventTitle}`,
              description: `Event ticket purchase`,
            },
            unit_amount: Math.round(price * 100), // Convert to pence
          },
          quantity: quantity || 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/events/${eventSlug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/events/${eventSlug}?payment=canceled`,
      metadata: {
        event_id: eventId,
        event_slug: eventSlug,
        user_id: user.id,
        quantity: String(quantity || 1),
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Create a pending ticket order (server-side record)
    const orderAmountPence = Math.round((price || 0) * 100) * (quantity || 1);
    const { error: orderError } = await supabaseService
      .from("event_ticket_orders")
      .insert({
        event_id: eventId,
        user_id: user.id,
        quantity: quantity || 1,
        amount_pence: orderAmountPence,
        currency: "gbp",
        stripe_session_id: session.id,
        status: "pending",
      });

    if (orderError) {
      logStep("WARNING: failed to create order record", { message: orderError.message });
    }

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
