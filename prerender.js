import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
  const { render } = await import('./dist/server/entry-server.js');
  
  const template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8');
  
  // Static routes from App.tsx (excluding dynamic routes with :slug, :id)
  const routes = [
    '/',
    '/auth',
    '/events',
    '/calendar',
    '/dashboard',
    '/blog',
    '/admin',
    '/about',
    '/contact',
    '/donate',
    '/event-guidelines',
    '/help-centre',
    '/privacy-policy',
    '/terms-and-conditions',
    '/partnership',
    '/sitemap',
    '/organization/new',
    '/ministers',
    '/organizations',
    '/minister/new',
    '/my-profiles',
    '/profile/edit'
  ];
  
  for (const route of routes) {
    console.log(`Rendering route: ${route}`);
    const { html } = render(route);
    const finalHtml = template.replace('<!--ssr-outlet-->', html);
    
    // Debug: Check if the HTML contains route-specific content
    const titleMatch = finalHtml.match(/<title>(.*?)<\/title>/);
    const h1Match = finalHtml.match(/<h1[^>]*>(.*?)<\/h1>/);
    console.log(`Route ${route} - Title: ${titleMatch ? titleMatch[1] : 'Not found'}, H1: ${h1Match ? h1Match[1] : 'Not found'}`);
    
    const filePath = path.resolve(__dirname, `dist/client${route === '/' ? '/index' : route}.html`);
    
    // Ensure directory exists before writing file
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, finalHtml);
    console.log(`Generated: ${filePath}`);
  }
}

prerender().catch(console.error);