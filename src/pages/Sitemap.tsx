import { useEffect } from 'react';
import { generateSitemap } from '../utils/sitemapGenerator';

const Sitemap = () => {
  useEffect(() => {
    // Set proper content type for XML
    const metaTag = document.createElement('meta');
    metaTag.httpEquiv = 'Content-Type';
    metaTag.content = 'application/xml; charset=utf-8';
    document.head.appendChild(metaTag);

    // Generate and serve the sitemap XML
    const sitemapXML = generateSitemap();
    
    // Clear the body and write XML directly
    document.body.innerHTML = '';
    document.body.style.fontFamily = 'monospace';
    document.body.style.whiteSpace = 'pre';
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.textContent = sitemapXML;

    return () => {
      // Cleanup
      const meta = document.querySelector('meta[http-equiv="Content-Type"]');
      if (meta) {
        meta.remove();
      }
    };
  }, []);

  return null;
};

export default Sitemap;