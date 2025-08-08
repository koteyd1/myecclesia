
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Fetch the sitemap from Supabase Edge Function
    const response = await fetch('https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap', {
      method: 'GET',
      headers: {
        'Accept': 'application/xml, text/xml, */*'
      }
    });

    if (!response.ok) {
      throw new Error(`Supabase function returned ${response.status}: ${response.statusText}`);
    }

    const sitemapXml = await response.text();

    // Validate that we received XML content
    if (!sitemapXml.trim().startsWith('<?xml')) {
      throw new Error('Invalid XML response from Supabase function');
    }

      // Set proper XML headers
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      
      res.status(200).send(sitemapXml);

  } catch (error) {
    console.error('Sitemap proxy error:', error);

    // Return a fallback XML sitemap with basic pages
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://myecclesia.co.uk</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://myecclesia.co.uk/events</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://myecclesia.co.uk/about</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Retry-After', '300'); // Suggest retry after 5 minutes
    
    res.status(503).send(fallbackSitemap);
  }
}
