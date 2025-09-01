import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function prerender() {
  const { render } = await import('./dist/server/entry-server.js');
  
  const template = fs.readFileSync(path.resolve(__dirname, 'dist/client/index.html'), 'utf-8');
  const routes = ['/'];
  
  for (const route of routes) {
    const { html } = render(route);
    const finalHtml = template.replace('<!--ssr-outlet-->', html);
    
    const filePath = path.resolve(__dirname, `dist/client${route === '/' ? '/index' : route}.html`);
    fs.writeFileSync(filePath, finalHtml);
  }
}

prerender().catch(console.error);