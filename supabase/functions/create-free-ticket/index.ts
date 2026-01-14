import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-FREE-TICKET] ${step}${detailsStr}`);
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

    const { 
      eventId, 
      eventSlug,
      eventTitle, 
      quantity, 
      ticketTypeId,
      ticketTypeName,
      eventDate,
      eventTime,
      eventLocation 
    } = await req.json();
    
    logStep("Request received", { eventId, eventSlug, quantity, ticketTypeId });

    // Get the actual event ID
    let actualEventId = eventId;
    if (!actualEventId && eventSlug) {
      const { data: eventData } = await supabaseService
        .from("events")
        .select("id, price")
        .eq("slug", eventSlug)
        .single();
      
      if (eventData) {
        actualEventId = eventData.id;
        // Verify this is indeed a free event or free ticket type
        if (eventData.price && eventData.price > 0 && !ticketTypeId) {
          throw new Error("This event requires payment");
        }
      }
    }

    if (!actualEventId) {
      throw new Error("Event not found");
    }

    // If ticket type is provided, verify it's free
    if (ticketTypeId) {
      const { data: ticketType } = await supabaseService
        .from("ticket_types")
        .select("price, quantity_available, quantity_sold")
        .eq("id", ticketTypeId)
        .single();
      
      if (ticketType) {
        if (ticketType.price > 0) {
          throw new Error("This ticket type requires payment");
        }
        const available = ticketType.quantity_available - ticketType.quantity_sold;
        if (available < quantity) {
          throw new Error("Not enough tickets available");
        }
      }
    }

    // Check if user already has a ticket for this event
    const { data: existingTicket } = await supabaseService
      .from("tickets")
      .select("id")
      .eq("event_id", actualEventId)
      .eq("user_id", user.id)
      .eq("status", "confirmed")
      .single();

    if (existingTicket) {
      return new Response(JSON.stringify({ 
        success: true, 
        ticketId: existingTicket.id,
        message: "You already have a ticket for this event" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Create the free ticket
    const { data: ticket, error: ticketError } = await supabaseService
      .from("tickets")
      .insert({
        event_id: actualEventId,
        user_id: user.id,
        quantity: quantity || 1,
        status: "confirmed",
        ticket_type_id: ticketTypeId || null,
        payment_metadata: {
          type: "free",
          event_title: eventTitle,
          event_date: eventDate,
          event_time: eventTime,
          event_location: eventLocation,
          ticket_type_name: ticketTypeName,
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
      const { error: updateError } = await supabaseService
        .from("ticket_types")
        .update({ 
          quantity_sold: supabaseService.rpc ? undefined : undefined 
        })
        .eq("id", ticketTypeId);
      
      // Use raw SQL increment
      await supabaseService
        .from("ticket_types")
        .select("quantity_sold")
        .eq("id", ticketTypeId)
        .single()
        .then(async ({ data }) => {
          if (data) {
            await supabaseService
              .from("ticket_types")
              .update({ quantity_sold: (data.quantity_sold || 0) + (quantity || 1) })
              .eq("id", ticketTypeId);
          }
        });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ticketId: ticket.id,
      message: "Free ticket created successfully" 
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
