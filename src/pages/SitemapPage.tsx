import { useEffect } from "react";

const SitemapPage = () => {
  useEffect(() => {
    // Immediately redirect to the Supabase function URL
    window.location.href = "https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap";
  }, []);

  // Return null to prevent any HTML rendering
  return null;
};

export default SitemapPage;