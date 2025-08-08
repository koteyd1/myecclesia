
exports.handler = async (event, context) => {
  // Set CORS headers for all responses
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
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

    // Return the XML with proper headers
    return {
      statusCode: 200,
      headers: {
        ...headers,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'X-Robots-Tag': 'noindex' // Prevent indexing of the proxy endpoint itself
      },
      body: sitemapXml
    };

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

    return {
      statusCode: 503,
      headers: {
        ...headers,
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Retry-After': '300' // Suggest retry after 5 minutes
      },
      body: fallbackSitemap
    };
  }
};
