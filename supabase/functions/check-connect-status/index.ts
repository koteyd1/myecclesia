import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CONNECT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user has a connected account in database
    const { data: accountData } = await supabaseClient
      .from("stripe_connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!accountData) {
      logStep("No connected account found");
      return new Response(JSON.stringify({ 
        has_account: false,
        account_status: null,
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        first_event_date: null,
        in_free_period: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the latest status from Stripe
    const account = await stripe.accounts.retrieve(accountData.stripe_account_id);
    logStep("Stripe account retrieved", { 
      accountId: account.id, 
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
    });

    // Determine account status
    let accountStatus = "pending";
    if (account.charges_enabled && account.payouts_enabled) {
      accountStatus = "active";
    } else if (account.details_submitted) {
      accountStatus = "pending_verification";
    }

    // Update database with latest status
    const { error: updateError } = await supabaseClient
      .from("stripe_connected_accounts")
      .update({
        account_status: accountStatus,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        details_submitted: account.details_submitted,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Error updating account status", { error: updateError.message });
    }

    // Calculate if in free period (6 months from first event)
    let inFreePeriod = true;
    if (accountData.first_event_date) {
      const firstEventDate = new Date(accountData.first_event_date);
      const sixMonthsLater = new Date(firstEventDate);
      sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
      inFreePeriod = new Date() < sixMonthsLater;
    }

    return new Response(JSON.stringify({
      has_account: true,
      stripe_account_id: accountData.stripe_account_id,
      account_status: accountStatus,
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      first_event_date: accountData.first_event_date,
      in_free_period: inFreePeriod,
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
