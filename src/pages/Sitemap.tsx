import { useEffect } from 'react';
import { generateSitemap } from '../utils/sitemapGenerator';

const Sitemap = () => {
  useEffect(() => {
    // Generate sitemap XML
    const sitemapXML = generateSitemap();
    
    // Create a blob with the XML content
    const blob = new Blob([sitemapXML], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link to download the sitemap
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    
    // Set the response headers to serve as XML
    document.title = 'Sitemap';
    
    // Replace the entire document content with the XML
    document.open();
    document.write(sitemapXML);
    document.close();
    
    // Clean up
    URL.revokeObjectURL(url);
  }, []);

  // This component won't actually render since we're replacing the document
  return null;
};

export default Sitemap;