import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import QRCode from "npm:qrcode@1.5.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-FREE-TICKET] ${step}${detailsStr}`);
};

// Generate QR code as base64 data URL
const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff'
      }
    });
    return qrCodeDataUrl;
  } catch (error) {
    logStep("Error generating QR code", { error });
    return '';
  }
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

    // Send confirmation email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey && user.email) {
      try {
        const resend = new Resend(resendKey);
        
        // Generate QR code with ticket verification data
        const qrData = JSON.stringify({
          ticketId: ticket.id,
          eventId: actualEventId,
          userId: user.id,
          eventTitle: eventTitle,
          quantity: quantity || 1,
          verifyUrl: `https://myecclesia.lovable.app/verify-ticket/${ticket.id}`
        });
        
        const qrCodeDataUrl = await generateQRCode(qrData);
        logStep("QR code generated", { hasQRCode: !!qrCodeDataUrl });
        
        const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'TBC';

        const ticketNumber = ticket.id.slice(0, 8).toUpperCase();
        const ticketQty = quantity || 1;

        // Get user's name from profile
        const { data: profile } = await supabaseService
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single();

        const userName = profile?.full_name || 'Guest';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ticket Confirmation</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
            <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🎟️ Free Ticket Confirmed!</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You're all set!</p>
              </div>
              
              <div style="padding: 30px;">
                <p style="margin: 0 0 20px 0;">Dear ${userName},</p>
                
                <p style="margin: 0 0 25px 0;">Your free ticket${ticketQty > 1 ? 's have' : ' has'} been confirmed. Please present this QR code at the event for check-in.</p>
                
                <!-- QR Code Section -->
                <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
                  <div style="background: white; border-radius: 12px; padding: 20px; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="Ticket QR Code" style="width: 180px; height: 180px; display: block;" />` : '<p style="color: #64748b;">QR Code</p>'}
                  </div>
                  <p style="color: #059669; font-weight: 600; margin: 15px 0 5px 0; font-size: 14px;">TICKET #${ticketNumber}</p>
                  <p style="color: #64748b; font-size: 12px; margin: 0;">Scan this code at check-in</p>
                </div>
                
                <!-- Event Details -->
                <div style="background: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e2e8f0;">
                  <h2 style="color: #059669; margin: 0 0 15px 0; font-size: 20px;">${eventTitle}</h2>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 10px 0; color: #64748b; width: 40px; vertical-align: top;">📅</td>
                      <td style="padding: 10px 0;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Date</span><br>
                        <span style="font-weight: 600; color: #1e293b;">${formattedDate}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #64748b; vertical-align: top;">🕐</td>
                      <td style="padding: 10px 0;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Time</span><br>
                        <span style="font-weight: 600; color: #1e293b;">${eventTime || 'TBC'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #64748b; vertical-align: top;">📍</td>
                      <td style="padding: 10px 0;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Location</span><br>
                        <span style="font-weight: 600; color: #1e293b;">${eventLocation || 'TBC'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #64748b; vertical-align: top;">🎫</td>
                      <td style="padding: 10px 0;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Tickets</span><br>
                        <span style="font-weight: 600; color: #1e293b;">${ticketQty} ticket${ticketQty > 1 ? 's' : ''}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; color: #64748b; vertical-align: top;">💰</td>
                      <td style="padding: 10px 0;">
                        <span style="color: #64748b; font-size: 12px; text-transform: uppercase;">Price</span><br>
                        <span style="font-weight: 600; color: #10b981;">FREE</span>
                      </td>
                    </tr>
                  </table>
                </div>
                
                <!-- Important Notice -->
                <div style="background: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                  <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>📌 Important:</strong> Please save this email or take a screenshot of the QR code. You may be asked to present it at the event entrance.</p>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center; margin: 30px 0;">
                  <a href="https://myecclesia.lovable.app/events/${eventSlug}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.3);">View Event Details</a>
                </div>
                
                <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">If you have any questions about the event, please contact the organizer directly.</p>
              </div>
              
              <!-- Footer -->
              <div style="background: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                  This confirmation was sent from MyEcclesia<br>
                  <a href="https://myecclesia.lovable.app" style="color: #10b981;">myecclesia.lovable.app</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        const emailResponse = await resend.emails.send({
          from: "MyEcclesia Tickets <tickets@myecclesia.org.uk>",
          to: [user.email],
          subject: `🎟️ Free Ticket Confirmed - ${eventTitle}`,
          html: emailHtml,
        });

        logStep("Confirmation email sent", { emailId: emailResponse.data?.id });
      } catch (emailError) {
        logStep("Error sending confirmation email", { error: emailError });
        // Don't fail the whole request if email fails
      }
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