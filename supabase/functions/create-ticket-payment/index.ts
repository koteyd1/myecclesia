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

// Platform fee percentage (0% for first 6 months, then configurable)
const PLATFORM_FEE_PERCENT = 0;

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

    const { eventId, eventTitle, price, quantity, buyerEmail, buyerName, eventDate, eventTime, eventLocation, ticketTypeId, ticketTypeName } = await req.json();
    logStep("Request received", { eventId, eventTitle, price, quantity, buyerEmail, ticketTypeId });

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

    // Get event details from database including stripe_account_id
    const { data: eventData } = await supabaseService
      .from("events")
      .select("id, title, date, time, location, stripe_account_id, created_by")
      .eq("slug", eventId)
      .single();

    logStep("Event data retrieved", { eventData });

    // Get the connected account for the event organizer
    let connectedAccountId = eventData?.stripe_account_id;
    
    // If no stripe_account_id on event, try to get from organizer's account
    if (!connectedAccountId && eventData?.created_by) {
      const { data: organizerAccount } = await supabaseService
        .from("stripe_connected_accounts")
        .select("stripe_account_id, charges_enabled, first_event_date")
        .eq("user_id", eventData.created_by)
        .single();

      if (organizerAccount?.charges_enabled) {
        connectedAccountId = organizerAccount.stripe_account_id;
        logStep("Using organizer's connected account", { connectedAccountId });

        // Update event with stripe_account_id for future use
        await supabaseService
          .from("events")
          .update({ stripe_account_id: connectedAccountId })
          .eq("id", eventData.id);

        // Track first event date if not set
        if (!organizerAccount.first_event_date) {
          await supabaseService
            .from("stripe_connected_accounts")
            .update({ first_event_date: new Date().toISOString() })
            .eq("user_id", eventData.created_by);
        }
      }
    }

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

    const totalAmount = Math.round(price * 100) * (quantity || 1); // Convert to pence
    
    // Build checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { 
              name: `Ticket: ${eventTitle}`,
              description: ticketTypeName ? `${ticketTypeName} - ${eventTitle}` : `Event ticket for ${eventTitle}`,
            },
            unit_amount: Math.round(price * 100),
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
    };

    // If there's a connected account, route payment to them
    if (connectedAccountId) {
      logStep("Using Stripe Connect for payment", { connectedAccountId });
      
      // Calculate application fee (0% during free period)
      const applicationFee = Math.round(totalAmount * (PLATFORM_FEE_PERCENT / 100));
      
      sessionOptions.payment_intent_data = {
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: connectedAccountId,
        },
      };
      
      logStep("Payment routing configured", { 
        totalAmount, 
        applicationFee, 
        destinationAccount: connectedAccountId 
      });
    } else {
      logStep("No connected account - payment goes to platform");
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    logStep("Checkout session created", { sessionId: session.id, connectedAccountId });

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
