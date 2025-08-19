import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip } = await req.json();
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Use a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,city`);
    const data = await response.json();

    if (data.status === 'success') {
      return new Response(
        JSON.stringify({
          country: data.country,
          country_code: data.countryCode,
          city: data.city
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    } else {
      // Return empty response if geolocation fails
      return new Response(
        JSON.stringify({
          country: null,
          country_code: null,
          city: null
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
  } catch (error) {
    console.error('Error getting visitor location:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to get location data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})