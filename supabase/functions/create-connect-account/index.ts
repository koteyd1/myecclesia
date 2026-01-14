import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if user already has a connected account
    const { data: existingAccount } = await supabaseClient
      .from("stripe_connected_accounts")
      .select("*")
      .eq("user_id", user.id)
      .single();

    let accountId: string;

    if (existingAccount) {
      logStep("Existing connected account found", { accountId: existingAccount.stripe_account_id });
      accountId = existingAccount.stripe_account_id;
    } else {
      // Create a new Stripe Connect Express account
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email,
        metadata: {
          user_id: user.id,
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      logStep("New Stripe Connect account created", { accountId: account.id });
      accountId = account.id;

      // Save account to database
      const { error: insertError } = await supabaseClient
        .from("stripe_connected_accounts")
        .insert({
          user_id: user.id,
          stripe_account_id: account.id,
          account_status: "pending",
          charges_enabled: false,
          payouts_enabled: false,
          details_submitted: false,
        });

      if (insertError) {
        logStep("Error saving account to database", { error: insertError.message });
        throw new Error(`Failed to save account: ${insertError.message}`);
      }
    }

    // Create account onboarding link
    const origin = req.headers.get("origin") || "https://myecclesia.lovable.app";
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}/dashboard?stripe_connect=refresh`,
      return_url: `${origin}/dashboard?stripe_connect=success`,
      type: "account_onboarding",
    });

    logStep("Account link created", { url: accountLink.url });

    return new Response(JSON.stringify({ url: accountLink.url }), {
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
