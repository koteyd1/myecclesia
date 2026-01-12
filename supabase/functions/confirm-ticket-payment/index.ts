import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CONFIRM-TICKET-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error("sessionId is required");

    // Get user from auth header
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseService.auth.getUser(token);
      user = userData.user;
    }

    if (!user) {
      throw new Error("Authentication required to confirm ticket purchase");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    logStep("Stripe session fetched", {
      sessionId,
      payment_status: session.payment_status,
      status: session.status,
    });

    const metadata = session.metadata || {};
    const sessionUserId = metadata.user_id;
    const eventId = metadata.event_id;
    const quantity = Math.max(1, parseInt(metadata.quantity || "1", 10) || 1);

    if (!eventId) throw new Error("Missing event_id in Stripe session metadata");
    if (!sessionUserId) throw new Error("Missing user_id in Stripe session metadata");
    if (sessionUserId !== user.id) throw new Error("This checkout session does not belong to the current user");

    if (session.payment_status !== "paid") {
      // Keep order pending; client can retry later
      return new Response(JSON.stringify({ ok: false, status: session.payment_status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Mark order paid (best-effort if row doesn't exist)
    const { error: orderUpdateError } = await supabaseService
      .from("event_ticket_orders")
      .update({
        status: "paid",
        amount_pence: session.amount_total ?? null,
        currency: session.currency ?? "gbp",
      })
      .eq("stripe_session_id", sessionId);

    if (orderUpdateError) {
      logStep("WARNING: failed to update ticket order", { message: orderUpdateError.message });
    }

    // Upsert registration as paid
    const { error: registrationError } = await supabaseService
      .from("event_registrations")
      .upsert(
        {
          user_id: user.id,
          event_id: eventId,
          status: "registered",
          quantity,
          payment_status: "paid",
          stripe_session_id: sessionId,
        },
        { onConflict: "user_id,event_id" },
      );

    if (registrationError) throw registrationError;

    // Decrement available_tickets if it represents remaining stock (> 0)
    const { data: eventRow, error: eventFetchError } = await supabaseService
      .from("events")
      .select("available_tickets")
      .eq("id", eventId)
      .maybeSingle();

    if (!eventFetchError && eventRow && typeof eventRow.available_tickets === "number" && eventRow.available_tickets > 0) {
      const next = Math.max(0, eventRow.available_tickets - quantity);
      const { error: eventUpdateError } = await supabaseService
        .from("events")
        .update({ available_tickets: next })
        .eq("id", eventId);

      if (eventUpdateError) {
        logStep("WARNING: failed to decrement available_tickets", { message: eventUpdateError.message });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
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

