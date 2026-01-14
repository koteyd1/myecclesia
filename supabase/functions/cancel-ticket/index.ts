import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-TICKET] ${step}${detailsStr}`);
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

    const { ticketId } = await req.json();
    
    if (!ticketId) {
      throw new Error("Ticket ID is required");
    }

    logStep("Request received", { ticketId, userId: user.id });

    // Fetch the ticket to verify ownership and get details
    const { data: ticket, error: ticketFetchError } = await supabaseService
      .from("tickets")
      .select(`
        id,
        user_id,
        event_id,
        status,
        ticket_type_id,
        quantity,
        check_in_status,
        events (
          id,
          date,
          title
        )
      `)
      .eq("id", ticketId)
      .single();

    if (ticketFetchError || !ticket) {
      throw new Error("Ticket not found");
    }

    // Verify ownership
    if (ticket.user_id !== user.id) {
      throw new Error("You don't have permission to cancel this ticket");
    }

    // Check if already cancelled
    if (ticket.status === "cancelled") {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Ticket is already cancelled" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if already checked in
    if (ticket.check_in_status === "checked_in") {
      throw new Error("Cannot cancel a ticket that has already been checked in");
    }

    // Check if event has already passed
    const eventData = ticket.events as { id: string; date: string; title: string } | null;
    if (eventData?.date) {
      const eventDate = new Date(eventData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        throw new Error("Cannot cancel a ticket for a past event");
      }
    }

    logStep("Ticket validated, proceeding with cancellation");

    // Update ticket status to cancelled
    const { error: updateError } = await supabaseService
      .from("tickets")
      .update({ 
        status: "cancelled",
        updated_at: new Date().toISOString()
      })
      .eq("id", ticketId);

    if (updateError) {
      logStep("Error updating ticket", { error: updateError.message });
      throw updateError;
    }

    logStep("Ticket status updated to cancelled");

    // Update event registration status
    const { error: regError } = await supabaseService
      .from("event_registrations")
      .update({ status: "cancelled" })
      .eq("event_id", ticket.event_id)
      .eq("user_id", user.id);

    if (regError) {
      logStep("Warning: Could not update registration", { error: regError.message });
    }

    // If there's a ticket type, decrement the quantity_sold
    if (ticket.ticket_type_id) {
      const { data: ticketType } = await supabaseService
        .from("ticket_types")
        .select("quantity_sold")
        .eq("id", ticket.ticket_type_id)
        .single();
      
      if (ticketType) {
        const newQuantitySold = Math.max(0, (ticketType.quantity_sold || 0) - (ticket.quantity || 1));
        await supabaseService
          .from("ticket_types")
          .update({ quantity_sold: newQuantitySold })
          .eq("id", ticket.ticket_type_id);
        
        logStep("Ticket type quantity updated", { ticketTypeId: ticket.ticket_type_id, newQuantitySold });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Ticket cancelled successfully" 
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