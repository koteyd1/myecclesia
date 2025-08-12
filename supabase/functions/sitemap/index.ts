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
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`

    // Static pages - matching actual routes from App.tsx
    const staticPages = [
      { url: '', priority: '1.0', changefreq: 'daily' },
      { url: '/events', priority: '0.9', changefreq: 'daily' },
      { url: '/calendar', priority: '0.8', changefreq: 'daily' },
      { url: '/blog', priority: '0.7', changefreq: 'weekly' },
      { url: '/about', priority: '0.7', changefreq: 'weekly' },
      { url: '/contact', priority: '0.6', changefreq: 'monthly' },
      { url: '/donate', priority: '0.8', changefreq: 'monthly' },
      { url: '/event-guidelines', priority: '0.4', changefreq: 'yearly' },
      { url: '/help-centre', priority: '0.5', changefreq: 'monthly' },
      { url: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
      { url: '/terms-and-conditions', priority: '0.3', changefreq: 'yearly' }
    ]

    // Add static pages
    for (const page of staticPages) {
      sitemap += `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`
    }

    // Add dynamic event pages
    if (events && events.length > 0) {
      for (const event of events) {
        const lastmod = event.updated_at ? new Date(event.updated_at).toISOString() : currentDate
        sitemap += `  <url>
    <loc>${baseUrl}/events/${event.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
`
      }
    }

    // Add dynamic blog post pages
    if (blogPosts && blogPosts.length > 0) {
      for (const post of blogPosts) {
        const lastmod = post.updated_at ? new Date(post.updated_at).toISOString() : currentDate
        sitemap += `  <url>
    <loc>${baseUrl}/blog/${post.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`
      }
    }

    sitemap += `</urlset>`

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