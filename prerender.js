
import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const toAbsolute = (p) => path.resolve(__dirname, p)

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

// Get routes from App.tsx
const routesToPrerender = extractRoutesFromApp();

console.log('Routes to prerender:', routesToPrerender);

;(async () => {
  try {
    for (const url of routesToPrerender) {
      console.log('Rendering:', url);
      
      try {
        const appHtml = render(url);
        const html = template.replace(`<!--app-html-->`, appHtml)

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
