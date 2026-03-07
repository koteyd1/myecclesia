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

// Platform fee is now read from platform_settings table
// Fallback default if DB read fails
const DEFAULT_PLATFORM_FEE_PERCENT = 0;

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

    const { eventId, eventTitle, price, quantity, buyerEmail, buyerName, eventDate, eventTime, eventLocation, ticketTypeId, ticketTypeName, donationAmount, giftAid, isGuest } = await req.json();
    logStep("Request received", { eventId, eventTitle, price, quantity, buyerEmail, ticketTypeId, donationAmount, giftAid, isGuest });

    // Get user from auth header (optional for guest checkout)
    let user = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabaseClient.auth.getUser(token);
      user = userData.user;
    }

    // For paid tickets, guest checkout is allowed (email required)
    if (!user && !buyerEmail) {
      throw new Error("Email is required for guest checkout");
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
    const customerEmail = buyerEmail || (user ? user.email : '');
    const customers = await stripe.customers.list({ 
      email: customerEmail, 
      limit: 1 
    });
    
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: customerEmail,
        name: buyerName || "Guest",
        metadata: {
          user_id: user?.id || 'guest',
          is_guest: String(!user),
        },
      });
      customerId = customer.id;
    }

    logStep("Customer handled", { customerId });

    // Validate stock availability before creating checkout session
    if (ticketTypeId) {
      const { data: ticketType } = await supabaseService
        .from("ticket_types")
        .select("quantity_available, quantity_sold, is_active")
        .eq("id", ticketTypeId)
        .single();

      if (ticketType) {
        if (!ticketType.is_active) {
          throw new Error("This ticket type is no longer available");
        }
        const available = ticketType.quantity_available - ticketType.quantity_sold;
        if (available < (quantity || 1)) {
          throw new Error(`Only ${available} ticket${available === 1 ? '' : 's'} remaining`);
        }
      }
    }

    const totalAmount = Math.round(price * 100) * (quantity || 1); // Convert to pence
    const donationAmountPence = donationAmount ? Math.round(donationAmount * 100) : 0;
    
    // Build line items
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    // Add ticket line item (only if price > 0)
    if (price > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { 
            name: `Ticket: ${eventTitle}`,
            description: ticketTypeName ? `${ticketTypeName} - ${eventTitle}` : `Event ticket for ${eventTitle}`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: quantity || 1,
      });
    }
    
    // Add donation line item if present
    if (donationAmountPence > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: { 
            name: `Donation to ${eventTitle}`,
            description: giftAid ? "Donation (Gift Aid eligible)" : "Voluntary donation to event organiser",
          },
          unit_amount: donationAmountPence,
        },
        quantity: 1,
      });
    }

    // Build checkout session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: lineItems,
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
        user_id: user?.id || 'guest',
        user_email: customerEmail,
        user_name: buyerName || 'Guest',
        quantity: String(quantity || 1),
        ticket_type_id: ticketTypeId || '',
        ticket_type_name: ticketTypeName || '',
        donation_amount: String(donationAmountPence),
        gift_aid: String(giftAid || false),
        is_guest: String(!user),
      },
    };

    // If there's a connected account, check if payouts are paused and route payment
    if (connectedAccountId) {
      // Check if organiser's payouts are paused
      const { data: accountCheck } = await supabaseService
        .from("stripe_connected_accounts")
        .select("payouts_paused")
        .eq("stripe_account_id", connectedAccountId)
        .single();

      const payoutsPaused = (accountCheck as any)?.payouts_paused === true;

      if (payoutsPaused) {
        logStep("Payouts paused for this organiser - payment goes to platform", { connectedAccountId });
        // Don't route to organiser, payment stays with platform
      } else {
        logStep("Using Stripe Connect for payment", { connectedAccountId });

        // Read platform fee settings from DB
        let platformFeePercent = DEFAULT_PLATFORM_FEE_PERCENT;
        let platformFeeFixedPence = 0;
        const { data: feeSettings } = await supabaseService
          .from("platform_settings")
          .select("key, value")
          .in("key", ["platform_fee_percent", "platform_fee_fixed_pence"]);
        
        if (feeSettings) {
          for (const s of feeSettings) {
            if (s.key === "platform_fee_percent") platformFeePercent = Number(s.value);
            if (s.key === "platform_fee_fixed_pence") platformFeeFixedPence = Number(s.value);
          }
        }

        // Check if organiser is in free period
        if (eventData?.created_by) {
          const { data: orgAccount } = await supabaseService
            .from("stripe_connected_accounts")
            .select("first_event_date")
            .eq("stripe_account_id", connectedAccountId)
            .single();

          if (orgAccount?.first_event_date) {
            const firstDate = new Date(orgAccount.first_event_date);
            const threeMonths = new Date(firstDate);
            threeMonths.setMonth(threeMonths.getMonth() + 3);
            if (new Date() < threeMonths) {
              platformFeePercent = 0;
              platformFeeFixedPence = 0;
              logStep("Organiser in free period - 0% fee");
            }
          }
        }

        // Calculate platform fee: percentage of total + fixed fee per ticket
        const ticketQuantity = quantity || 1;
        const fullTotal = totalAmount + donationAmountPence;
        const percentageFee = Math.round(fullTotal * (platformFeePercent / 100));
        const fixedFee = platformFeeFixedPence * ticketQuantity;
        
        // Stripe processing fee estimate: 1.4% + 20p (UK cards) / 2.9% + 20p (intl)
        // We use 2.9% + 30p as conservative estimate to cover processing costs
        const stripeProcessingFee = Math.round(fullTotal * 0.029) + 30;
        
        // Total application fee = platform fee + per-ticket fee + Stripe processing
        // This means the organiser absorbs all fees; buyer pays face value
        const applicationFee = percentageFee + fixedFee + stripeProcessingFee;
        
        sessionOptions.payment_intent_data = {
          application_fee_amount: applicationFee,
          transfer_data: {
            destination: connectedAccountId,
          },
        };
        
        logStep("Payment routing configured", { 
          totalAmount, 
          percentageFee,
          fixedFee,
          stripeProcessingFee,
          applicationFee,
          platformFeePercent,
          platformFeeFixedPence,
          destinationAccount: connectedAccountId 
        });
      }
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
