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
        paypal_email: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // If this is a PayPal-only account, skip Stripe API call
    const isPaypalOnly = accountData.stripe_account_id?.startsWith('paypal_only_');
    
    if (isPaypalOnly) {
      logStep("PayPal-only account found");
      return new Response(JSON.stringify({
        has_account: true,
        stripe_account_id: null,
        account_status: 'active',
        charges_enabled: false,
        payouts_enabled: false,
        details_submitted: false,
        first_event_date: accountData.first_event_date,
        in_free_period: true,
        paypal_email: accountData.paypal_email,
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

    // Check if status just transitioned to active
    const justBecameActive = accountStatus === "active" && accountData.account_status !== "active";

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

    // Send activation email if account just became active
    if (justBecameActive && user.email) {
      logStep("Account just became active, sending notification email");
      try {
        const resendKey = Deno.env.get("RESEND_API_KEY");
        if (resendKey) {
          const profileName = user.user_metadata?.full_name || "there";
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${resendKey}`,
            },
            body: JSON.stringify({
              from: "MyEcclesia <notifications@myecclesia.org.uk>",
              to: [user.email],
              subject: "Your payment account is now active! ✅",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #1a1a2e; font-size: 24px;">Payment Account Activated 🎉</h1>
                  <p>Hi ${profileName},</p>
                  <p>Great news — your Stripe payment account has been verified and is now <strong>fully active</strong>!</p>
                  <p>You can now:</p>
                  <ul>
                    <li>Create paid events and sell tickets</li>
                    <li>Receive payments directly to your bank account</li>
                    <li>Track your revenue in the Finance dashboard</li>
                  </ul>
                  <p>Your first 3 months are <strong>fee-free</strong> — no platform commission on your ticket sales during this period.</p>
                  <div style="margin: 30px 0;">
                    <a href="https://myecclesia.org.uk/dashboard" style="background-color: #1a1a2e; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Go to Dashboard</a>
                  </div>
                  <p style="color: #666; font-size: 14px;">If you have any questions, visit our <a href="https://myecclesia.org.uk/help-centre">Help Centre</a> or <a href="https://myecclesia.org.uk/contact">contact us</a>.</p>
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="color: #999; font-size: 12px;">— The MyEcclesia Team</p>
                </div>
              `,
            }),
          });
          logStep("Activation email sent successfully");
        } else {
          logStep("RESEND_API_KEY not set, skipping email");
        }
      } catch (emailErr) {
        logStep("Error sending activation email (non-fatal)", { error: String(emailErr) });
      }
    }

    // Calculate if in free period (3 months from first event)
    let inFreePeriod = true;
    if (accountData.first_event_date) {
      const firstEventDate = new Date(accountData.first_event_date);
      const threeMonthsLater = new Date(firstEventDate);
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      inFreePeriod = new Date() < threeMonthsLater;
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
      paypal_email: accountData.paypal_email,
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
