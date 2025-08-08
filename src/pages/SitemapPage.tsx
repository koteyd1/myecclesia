
import { useEffect, useState } from "react";

const SitemapPage = () => {
  const [sitemapContent, setSitemapContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const response = await fetch('https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch sitemap: ${response.status}`);
        }

        const xmlContent = await response.text();
        setSitemapContent(xmlContent);
        
        // Set the correct content type for the page
        document.contentType = 'application/xml';
        
      } catch (err) {
        console.error('Error fetching sitemap:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return <div>Loading sitemap...</div>;
  }

  if (error) {
    return <div>Error loading sitemap: {error}</div>;
  }

  // Render the XML content as pre-formatted text
  return (
    <pre 
      style={{ 
        fontFamily: 'monospace', 
        whiteSpace: 'pre-wrap',
        margin: 0,
        padding: '1rem' 
      }}
      dangerouslySetInnerHTML={{ __html: sitemapContent }}
    />
  );
};

export default SitemapPage;
