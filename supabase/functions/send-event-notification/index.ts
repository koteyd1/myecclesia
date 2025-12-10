import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewEventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  image: string;
  slug: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-event-notification function invoked");

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { event }: { event: NewEventData } = await req.json();
    
    console.log("Processing notification for event:", event.title);

    if (!event || !event.id) {
      console.error("No event data provided");
      return new Response(
        JSON.stringify({ error: "No event data provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Find users with matching preferences
    const { data: matchingPrefs, error: prefsError } = await supabase
      .from("notification_preferences")
      .select("email, categories, locations")
      .eq("enabled", true);

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
      throw prefsError;
    }

    console.log(`Found ${matchingPrefs?.length || 0} users with notifications enabled`);

    // Filter users whose preferences match the event
    const usersToNotify = matchingPrefs?.filter((pref) => {
      // If user has no category preferences, notify about all events
      const categoryMatch = !pref.categories?.length || 
        (event.category && pref.categories.includes(event.category));
      
      // If user has location preferences, check for partial match
      const locationMatch = !pref.locations?.length || 
        pref.locations.some((loc: string) => 
          event.location?.toLowerCase().includes(loc.toLowerCase())
        );

      return categoryMatch && locationMatch;
    }) || [];

    console.log(`${usersToNotify.length} users match the event criteria`);

    if (usersToNotify.length === 0) {
      return new Response(
        JSON.stringify({ message: "No users to notify", notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send emails to matching users
    const emailPromises = usersToNotify.map(async (pref) => {
      try {
        const eventDate = new Date(event.date).toLocaleDateString("en-GB", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">New Event Alert! 🎉</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              ${event.image ? `<img src="${event.image}" alt="${event.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">` : ''}
              
              <h2 style="color: #1f2937; margin-top: 0;">${event.title}</h2>
              
              ${event.category ? `<span style="background: #e0e7ff; color: #3730a3; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${event.category}</span>` : ''}
              
              <div style="margin: 20px 0; padding: 15px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
                <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
                <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${event.time}</p>
                <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${event.location}</p>
              </div>
              
              ${event.description ? `<p style="color: #6b7280;">${event.description.substring(0, 200)}${event.description.length > 200 ? '...' : ''}</p>` : ''}
              
              <a href="https://myecclesia.com/events/${event.slug || event.id}" 
                 style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                View Event Details →
              </a>
            </div>
            
            <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 20px;">
              You received this because you enabled event notifications on myEcclesia.<br>
              <a href="https://myecclesia.com/dashboard" style="color: #6366f1;">Manage your notification preferences</a>
            </p>
          </body>
          </html>
        `;

        const result = await resend.emails.send({
          from: "myEcclesia <notifications@resend.dev>",
          to: [pref.email],
          subject: `New Event: ${event.title}`,
          html: emailHtml,
        });

        console.log(`Email sent to ${pref.email}:`, result);
        return { email: pref.email, success: true };
      } catch (emailError) {
        console.error(`Failed to send email to ${pref.email}:`, emailError);
        return { email: pref.email, success: false, error: emailError };
      }
    });

    const results = await Promise.all(emailPromises);
    const successCount = results.filter((r) => r.success).length;

    console.log(`Notification emails sent: ${successCount}/${usersToNotify.length}`);

    return new Response(
      JSON.stringify({ 
        message: "Notifications sent", 
        notified: successCount,
        total: usersToNotify.length 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-event-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
