import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  console.log('Sitemap function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get current date to filter future events
    const today = new Date().toISOString().split('T')[0]
    console.log('Fetching events from date:', today)

    // Fetch active events (date >= today)
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, date, updated_at')
      .gte('date', today)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching events:', error)
      return new Response('Error fetching events', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    console.log(`Found ${events?.length || 0} events`)

    // Generate sitemap XML
    const baseUrl = 'https://myecclesia.co.uk'
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/events</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`

    // Add event URLs
    if (events && events.length > 0) {
      for (const event of events) {
        const eventUrl = `${baseUrl}/events/${event.id}`
        const lastmod = new Date(event.updated_at).toISOString()
        
        sitemap += `
  <url>
    <loc>${eventUrl}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
      }
    }

    sitemap += `
</urlset>`

    console.log(`Generated sitemap with ${events?.length || 0} events`)

    return new Response(sitemap, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })

  } catch (error) {
    console.error('Sitemap generation error:', error)
    return new Response('Internal server error', { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
    })
  }
})