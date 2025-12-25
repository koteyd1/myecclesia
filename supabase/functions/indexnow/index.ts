import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INDEXNOW_KEY = "1a05fadd0adb40d282d1bf0be8ea606d";
const HOST = "myecclesia.org.uk";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      console.error("No URLs provided");
      return new Response(
        JSON.stringify({ error: "No URLs provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure all URLs are absolute
    const absoluteUrls = urls.map((url: string) => 
      url.startsWith('http') ? url : `https://${HOST}${url.startsWith('/') ? url : '/' + url}`
    );

    console.log("Submitting URLs to IndexNow:", absoluteUrls);

    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
        urlList: absoluteUrls,
      }),
    });

    const status = response.status;
    let responseText = "";
    
    try {
      responseText = await response.text();
    } catch (e) {
      console.log("No response body from IndexNow");
    }

    console.log(`IndexNow response: ${status} - ${responseText}`);

    // IndexNow returns 200 for success, 202 for accepted
    if (status === 200 || status === 202) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "URLs submitted successfully",
          urlCount: absoluteUrls.length,
          status 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        message: `IndexNow returned status ${status}`,
        details: responseText 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("IndexNow error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
