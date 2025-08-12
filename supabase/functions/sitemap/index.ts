import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
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

    // Fetch active events (date >= today)
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('id, title, date, updated_at')
      .gte('date', today)
      .order('date', { ascending: true })

    // Fetch published blog posts
    const { data: blogPosts, error: blogError } = await supabase
      .from('blog_posts')
      .select('id, title, updated_at')
      .eq('published', true)
      .order('updated_at', { ascending: false })

    if (eventsError) {
      console.error('Error fetching events:', eventsError)
      return new Response('Error fetching events', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    if (blogError) {
      console.error('Error fetching blog posts:', blogError)
      return new Response('Error fetching blog posts', { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Generate sitemap XML
    const baseUrl = 'https://myecclesia.co.uk'
    const currentDate = new Date().toISOString()
    
    // Helper to build each <url> entry safely
    const urlElement = (loc: string, lastmod: string, changefreq: string, priority: string | number) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`

    const urls: string[] = []

    // Static pages - matching actual routes from App.tsx
    urls.push(urlElement(`${baseUrl}`, currentDate, 'daily', '1.0'))
    urls.push(urlElement(`${baseUrl}/events`, currentDate, 'daily', '0.9'))
    urls.push(urlElement(`${baseUrl}/calendar`, currentDate, 'daily', '0.8'))
    urls.push(urlElement(`${baseUrl}/blog`, currentDate, 'weekly', '0.7'))
    urls.push(urlElement(`${baseUrl}/about`, currentDate, 'weekly', '0.7'))
    urls.push(urlElement(`${baseUrl}/contact`, currentDate, 'monthly', '0.6'))
    urls.push(urlElement(`${baseUrl}/donate`, currentDate, 'monthly', '0.8'))
    urls.push(urlElement(`${baseUrl}/event-guidelines`, currentDate, 'yearly', '0.4'))
    urls.push(urlElement(`${baseUrl}/help-centre`, currentDate, 'monthly', '0.5'))
    urls.push(urlElement(`${baseUrl}/privacy-policy`, currentDate, 'yearly', '0.3'))
    urls.push(urlElement(`${baseUrl}/terms-and-conditions`, currentDate, 'yearly', '0.3'))

    // Dynamic event pages
    if (events && events.length > 0) {
      for (const event of events) {
        const eventUrl = `${baseUrl}/events/${event.id}`
        const lastmod = event.updated_at ? new Date(event.updated_at).toISOString() : currentDate
        urls.push(urlElement(eventUrl, lastmod, 'daily', '0.8'))
      }
    }

    // Dynamic blog post pages
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const blogUrl = `${baseUrl}/blog/${post.id}`
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : currentDate
        urls.push(urlElement(blogUrl, lastmod, 'weekly', '0.7'))
      }
    }

    const sitemap = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
      ...urls,
      '</urlset>'
    ].join('\n')

    console.log(`Generated sitemap with ${events?.length || 0} events and ${blogPosts?.length || 0} blog posts`)

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