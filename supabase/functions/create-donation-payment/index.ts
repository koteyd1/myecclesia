import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-DONATION-PAYMENT] ${step}${detailsStr}`);
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

    const { amount, donationType, donorInfo, isAuthenticated } = await req.json();
    logStep("Request received", { amount, donationType, donorInfo, isAuthenticated });

    let user = null;
    if (isAuthenticated) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: userData } = await supabaseService.auth.getUser(token);
        user = userData.user;
      }
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check if customer exists
    const customers = await stripe.customers.list({ 
      email: donorInfo.email, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: donorInfo.email,
        name: donorInfo.name,
        phone: donorInfo.phone,
      });
      customerId = customer.id;
    }

    logStep("Customer handled", { customerId });

    // Create checkout session
    const sessionData: any = {
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { 
              name: donationType === 'recurring' ? 'Monthly Donation' : 'One-time Donation' 
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: donationType === 'recurring' ? 'subscription' : 'payment',
      success_url: `${req.headers.get("origin")}/donate?success=true`,
      cancel_url: `${req.headers.get("origin")}/donate?canceled=true`,
    };

    if (donationType === 'recurring') {
      sessionData.line_items[0].price_data.recurring = { interval: 'month' };
    }

    const session = await stripe.checkout.sessions.create(sessionData);
    logStep("Checkout session created", { sessionId: session.id });

    // Record donation in database
    const donationData = {
      user_id: user?.id || null,
      email: donorInfo.email,
      full_name: donorInfo.name,
      phone: donorInfo.phone,
      amount: amount * 100, // Store in cents
      donation_type: donationType,
      stripe_customer_id: customerId,
      stripe_session_id: session.id,
      message: donorInfo.message || null,
      status: 'pending',
    };

    const { error: insertError } = await supabaseService
      .from('donations')
      .insert(donationData);

    if (insertError) {
      logStep("Database insert error", insertError);
      throw new Error(`Failed to record donation: ${insertError.message}`);
    }

    logStep("Donation recorded in database");

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