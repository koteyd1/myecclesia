import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.5";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { PasswordResetEmail } from './_templates/password-reset-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PasswordResetRequest {
  email: string;
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
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Generate password reset link using Supabase
    // Always redirect to the production site
    const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: 'https://myecclesia.org.uk/auth?reset=true'
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      // Return success even if user doesn't exist (security best practice)
      return new Response(
        JSON.stringify({ success: true, message: 'Password reset email sent if account exists' }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    if (!resetData?.properties?.action_link) {
      throw new Error('No reset link generated');
    }

    // Render the email template
    const emailHtml = await renderAsync(
      React.createElement(PasswordResetEmail, {
        userEmail: email,
        resetUrl: resetData.properties.action_link,
      })
    );

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: 'MyEcclesia <welcome@myecclesia.org.uk>',
      to: [email],
      subject: 'Reset Your MyEcclesia Password',
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error('Resend error:', emailResponse.error);
      throw new Error('Failed to send email');
    }

    console.log(`Password reset email sent to ${email}, ID: ${emailResponse.data?.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent successfully' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error in send-password-reset function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send password reset email',
        success: false 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
};

serve(handler);