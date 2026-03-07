
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

// Initialize Supabase client for fetching dynamic content
const supabaseUrl = 'https://api.myecclesiahub.com'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFra2VlYnVheHJjYXlid2V6anZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQyNzAyNzQsImV4cCI6MjA0OTg0NjI3NH0.9OJCLlDxbFxrVzg1zPy9Z0hGR0sBP7FoWXnKz7Y5nII'
const supabase = createClient(supabaseUrl, supabaseKey)

// Function to ensure directory exists
const ensureDirectoryExists = (filePath) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Extract routes from App.tsx
const extractRoutesFromApp = () => {
  try {
    const appContent = fs.readFileSync(toAbsolute('src/App.tsx'), 'utf-8');
    
    // Extract route paths from <Route path="..." elements
    const routeMatches = appContent.match(/<Route\s+path="([^"]+)"/g);
    
    if (!routeMatches) {
      console.warn('No routes found in App.tsx, using fallback routes');
      return ['/'];
    }
    
    const routes = routeMatches
      .map(match => {
        const pathMatch = match.match(/path="([^"]+)"/);
        return pathMatch ? pathMatch[1] : null;
      })
      .filter(path => path && !path.includes('*') && !path.includes(':')) // Exclude catch-all and dynamic routes
      .map(path => path === '/' ? '/' : path); // Keep root as is
    
    // Remove duplicates and sort
    return [...new Set(routes)].sort();
  } catch (error) {
    console.error('Error reading App.tsx:', error);
    return ['/'];
  }
};

const template = fs.readFileSync(toAbsolute('dist/index.html'), 'utf-8')
const { render } = await import('./dist/server/entry-server.js')

// Fetch dynamic content for prerendering
const fetchDynamicRoutes = async () => {
  try {
    // Fetch blog posts
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('published', true);

    // Fetch events
    const { data: events } = await supabase
      .from('events')
      .select('slug')
      .gte('event_date', new Date().toISOString());

    const blogRoutes = blogPosts?.map(post => `/blog/${post.slug}`) || [];
    const eventRoutes = events?.map(event => `/events/${event.slug}`) || [];

    return [...blogRoutes, ...eventRoutes];
  } catch (error) {
    console.warn('Could not fetch dynamic routes from database:', error);
    
    // Fallback to hardcoded routes for essential pages
    return [
      '/blog/welcome-to-myecclesia-connecting-faith-communities',
      '/blog/building-stronger-communities-through-technology',
      '/blog/the-future-of-digital-ministry'
    ];
  }
};

// Get static routes from App.tsx and dynamic routes from database
const staticRoutes = extractRoutesFromApp();
const dynamicRoutes = await fetchDynamicRoutes();
const routesToPrerender = [...staticRoutes, ...dynamicRoutes];

console.log('Static routes to prerender:', staticRoutes);
console.log('Dynamic routes to prerender:', dynamicRoutes);
console.log('Total routes to prerender:', routesToPrerender.length);

;(async () => {
  try {
    for (const url of routesToPrerender) {
      console.log('Rendering:', url);
      
      try {
        const appHtml = render(url);
        const html = template.replace(`<!--app-html-->`, appHtml)
          .replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)

        // Determine output file path
        let filePath;
        if (url === '/') {
          filePath = toAbsolute('dist/index.html');
        } else {
          // For routes like /about, /blog, etc., create directory structure
          const cleanPath = url.startsWith('/') ? url.slice(1) : url;
          filePath = toAbsolute(`dist/${cleanPath}/index.html`);
        }

        // Ensure directory exists before writing
        ensureDirectoryExists(filePath);
        
        fs.writeFileSync(filePath, html);
        console.log('Pre-rendered:', filePath);
      } catch (renderError) {
        console.error(`Failed to render ${url}:`, renderError);
        // Continue with other routes even if one fails
      }
    }
    console.log('✅ Prerendering completed successfully');
  } catch (error) {
    console.error('❌ Prerendering failed:', error);
    // Don't fail the build, just log the error
    process.exit(0);
  }
})()
