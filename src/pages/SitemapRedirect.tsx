import { useEffect } from "react";

const SitemapRedirect = () => {
  useEffect(() => {
    // Redirect to the Supabase sitemap function
    window.location.replace("https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap");
  }, []);

  return null;
};

export default SitemapRedirect;