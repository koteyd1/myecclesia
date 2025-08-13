export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private baseUrl: string;
  private urls: SitemapUrl[] = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  addUrl(url: SitemapUrl) {
    this.urls.push({
      ...url,
      loc: url.loc.startsWith('http') ? url.loc : `${this.baseUrl}${url.loc}`
    });
  }

  addStaticPages() {
    const staticPages = [
      { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
      { loc: '/about', changefreq: 'monthly' as const, priority: 0.8 },
      { loc: '/events', changefreq: 'daily' as const, priority: 0.9 },
      { loc: '/blog', changefreq: 'daily' as const, priority: 0.9 },
      { loc: '/calendar', changefreq: 'daily' as const, priority: 0.8 },
      { loc: '/contact', changefreq: 'monthly' as const, priority: 0.7 },
      { loc: '/donate', changefreq: 'monthly' as const, priority: 0.8 },
      { loc: '/auth', changefreq: 'monthly' as const, priority: 0.5 },
      { loc: '/dashboard', changefreq: 'weekly' as const, priority: 0.6 },
      { loc: '/help-centre', changefreq: 'weekly' as const, priority: 0.6 },
      { loc: '/privacy-policy', changefreq: 'yearly' as const, priority: 0.3 },
      { loc: '/terms-and-conditions', changefreq: 'yearly' as const, priority: 0.3 },
      { loc: '/event-guidelines', changefreq: 'monthly' as const, priority: 0.5 }
    ];

    staticPages.forEach(page => this.addUrl({
      ...page,
      lastmod: new Date().toISOString().split('T')[0]
    }));
  }

  generateXML(): string {
    const urlsXML = this.urls.map(url => {
      return `  <url>
    <loc>${this.escapeXML(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority !== undefined ? `<priority>${url.priority}</priority>` : ''}
  </url>`;
    }).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlsXML}
</urlset>`;
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
}

export function generateSitemap(): string {
  const generator = new SitemapGenerator('https://myecclesia.co.uk');
  
  // Add static pages
  generator.addStaticPages();

  // You can extend this to add dynamic content if needed
  // For example, if you have events or blog posts data available client-side
  
  return generator.generateXML();
}