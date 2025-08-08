import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SitemapPage = () => {
  useEffect(() => {
    const fetchAndRedirectSitemap = async () => {
      try {
        // Call the Supabase sitemap function
        const { data, error } = await supabase.functions.invoke('sitemap');
        
        if (error) {
          console.error('Error fetching sitemap:', error);
          return;
        }

        // Create a blob with the XML content and correct content type
        const blob = new Blob([data], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        
        // Replace the current page with the XML content
        window.location.replace(url);
      } catch (error) {
        console.error('Sitemap fetch error:', error);
        // Fallback: redirect to the direct function URL
        window.location.replace("https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap");
      }
    };

    fetchAndRedirectSitemap();
  }, []);

  return (
    <div>
      <p>Generating sitemap...</p>
    </div>
  );
};

export default SitemapPage;