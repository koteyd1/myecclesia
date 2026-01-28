import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteAccountRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create admin client for deletion operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create client with user's auth to verify identity
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the JWT token
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !userData?.user) {
      console.error("Token validation error:", userError);
      throw new Error("Invalid or expired token");
    }

    const requestingUser = userData.user;
    const { userId }: DeleteAccountRequest = await req.json();

    // Security check: User can only delete their own account
    if (requestingUser.id !== userId) {
      console.error("User attempted to delete another user's account");
      throw new Error("You can only delete your own account");
    }

    // Check if user is an admin - admins should use the admin panel
    const { data: userRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    if (userRole?.role === "admin") {
      throw new Error("Admin accounts cannot be self-deleted. Please contact system administrator.");
    }

    console.log(`User ${userId} requesting account deletion`);

    // Log the deletion request for audit purposes
    await supabaseAdmin.from("admin_audit_log").insert({
      user_id: userId,
      action: "SELF_ACCOUNT_DELETION",
      table_name: "auth.users",
      record_id: userId,
      old_values: {
        email: requestingUser.email,
        deletion_requested_at: new Date().toISOString(),
      },
    });

    // Delete user data from various tables (cascade should handle most, but be explicit)
    // Note: Order matters due to foreign key constraints

    // Delete saved events
    await supabaseAdmin.from("saved_events").delete().eq("user_id", userId);

    // Delete event registrations
    await supabaseAdmin.from("event_registrations").delete().eq("user_id", userId);

    // Delete user calendar entries
    await supabaseAdmin.from("user_calendar").delete().eq("user_id", userId);

    // Delete notification preferences
    await supabaseAdmin.from("notification_preferences").delete().eq("user_id", userId);

    // Delete minister followers (where user is the follower)
    await supabaseAdmin.from("minister_followers").delete().eq("user_id", userId);

    // Delete organization followers (where user is the follower)
    await supabaseAdmin.from("organization_followers").delete().eq("user_id", userId);

    // Delete group memberships
    await supabaseAdmin.from("group_members").delete().eq("user_id", userId);

    // Delete group post likes
    await supabaseAdmin.from("group_post_likes").delete().eq("user_id", userId);

    // Delete group post comments
    await supabaseAdmin.from("group_post_comments").delete().eq("user_id", userId);

    // Delete tickets
    await supabaseAdmin.from("tickets").delete().eq("user_id", userId);

    // Delete opportunity applications
    await supabaseAdmin.from("opportunity_applications").delete().eq("user_id", userId);

    // Update donations to anonymize (keep for financial records but remove PII link)
    await supabaseAdmin
      .from("donations")
      .update({ 
        user_id: null,
        full_name: "[Deleted User]",
        phone: null 
      })
      .eq("user_id", userId);

    // Delete minister profile if exists
    const { data: minister } = await supabaseAdmin
      .from("ministers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (minister) {
      // Delete minister's followers first
      await supabaseAdmin.from("minister_followers").delete().eq("minister_id", minister.id);
      // Update events to remove minister association
      await supabaseAdmin.from("events").update({ minister_id: null }).eq("minister_id", minister.id);
      // Update opportunities to remove minister association
      await supabaseAdmin.from("opportunities").update({ minister_id: null }).eq("minister_id", minister.id);
      // Delete minister profile
      await supabaseAdmin.from("ministers").delete().eq("id", minister.id);
    }

    // Delete organization profile if exists
    const { data: organization } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (organization) {
      // Delete organization's followers first
      await supabaseAdmin.from("organization_followers").delete().eq("organization_id", organization.id);
      // Update events to remove organization association
      await supabaseAdmin.from("events").update({ organization_id: null }).eq("organization_id", organization.id);
      // Update opportunities to remove organization association
      await supabaseAdmin.from("opportunities").update({ organization_id: null }).eq("organization_id", organization.id);
      // Delete organization profile
      await supabaseAdmin.from("organizations").delete().eq("id", organization.id);
    }

    // Delete group posts (where user is the author)
    await supabaseAdmin.from("group_posts").delete().eq("user_id", userId);

    // Delete groups created by user
    await supabaseAdmin.from("groups").delete().eq("created_by", userId);

    // Delete Stripe connected account record
    await supabaseAdmin.from("stripe_connected_accounts").delete().eq("user_id", userId);

    // Delete user profile
    await supabaseAdmin.from("profiles").delete().eq("user_id", userId);

    // Delete user role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);

    // Finally, delete the auth user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted account for user ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-account function:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "An unexpected error occurred",
        success: false,
      }),
      {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);
