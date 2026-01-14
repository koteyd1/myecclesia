import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeleteUserRequest {
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create client with the user's auth header to verify the token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the JWT token by explicitly passing it to Supabase Auth
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !requestingUser) {
      console.error('Token validation error:', userError);
      throw new Error('Invalid or expired token');
    }

    const requestingUserId = requestingUser.id;
    if (!requestingUserId) {
      throw new Error('Invalid token: missing user ID');
    }

    // Check if the requesting user is an admin
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUserId)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      throw new Error('User is not an admin');
    }

    // Parse request body
    const { userId: targetUserId }: DeleteUserRequest = await req.json();

    if (!targetUserId) {
      throw new Error('User ID is required');
    }

    // Prevent admins from deleting themselves
    if (requestingUserId === targetUserId) {
      throw new Error('Admins cannot delete themselves');
    }

    // Check if target user is an admin
    const { data: targetUserRole, error: targetRoleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .single();

    if (targetRoleError && targetRoleError.code !== 'PGRST116') {
      throw new Error('Error checking target user role');
    }

    // Prevent deletion if target user is an admin (additional safety)
    if (targetUserRole?.role === 'admin') {
      throw new Error('Cannot delete admin users');
    }

    console.log(`Admin ${requestingUserId} attempting to delete user ${targetUserId}`);

    // Delete the user using admin client
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    console.log(`Successfully deleted user ${targetUserId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in delete-user function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        success: false 
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);