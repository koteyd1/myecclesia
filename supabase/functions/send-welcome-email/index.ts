import React from 'npm:react@18.3.1'
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { WelcomeEmail } from './_templates/welcome-email.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') // Optional webhook secret

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const payload = await req.text()
    const headers = Object.fromEntries(req.headers)
    
    // If we have a webhook secret, verify the webhook
    if (hookSecret) {
      const wh = new Webhook(hookSecret)
      try {
        wh.verify(payload, headers)
      } catch (error) {
        console.error('Webhook verification failed:', error)
        return new Response('Unauthorized', { 
          status: 401,
          headers: corsHeaders 
        })
      }
    }

    const data = JSON.parse(payload)
    console.log('Received webhook data:', JSON.stringify(data, null, 2))
    
    // Extract user and email data from Supabase auth webhook
    if (!data.user || !data.email_data) {
      console.error('Missing required webhook data:', data)
      return new Response('Invalid webhook payload', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    const { 
      user,
      email_data: { 
        token, 
        token_hash, 
        redirect_to, 
        email_action_type,
        site_url 
      } 
    } = data

    // Only send welcome email for signup confirmations
    if (email_action_type !== 'signup') {
      return new Response('Not a signup confirmation', { 
        status: 200,
        headers: corsHeaders 
      })
    }

    // Build confirmation URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? site_url
    const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

    // Render the React email template
    const html = await renderAsync(
      React.createElement(WelcomeEmail, {
        userEmail: user.email,
        confirmationUrl,
      })
    )

    // Check if RESEND_API_KEY is configured
    if (!Deno.env.get('RESEND_API_KEY')) {
      console.log('RESEND_API_KEY not configured, skipping email send')
      return new Response(JSON.stringify({ success: true, message: 'Email sending disabled' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }

    // Send email using Resend
    const { data: emailData, error } = await resend.emails.send({
      from: 'MyEcclesia <welcome@myecclesia.com>',
      to: [user.email],
      subject: 'Welcome to MyEcclesia - Please confirm your email',
      html,
    })

    if (error) {
      console.error('Error sending email:', error)
      // Do NOT fail signups due to email issues; acknowledge with 200
      return new Response(JSON.stringify({ success: false, message: 'Email send failed, but signup proceeds' }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }

    console.log('Welcome email sent successfully:', emailData)

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    })

  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        },
      }
    )
  }
})