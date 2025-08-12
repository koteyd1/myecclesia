import { useEffect } from 'react';

const Sitemap = () => {
  useEffect(() => {
    // Redirect to the edge function that serves the sitemap
    window.location.replace('https://imwastdmyeaaslurcovw.supabase.co/functions/v1/sitemap');
  }, []);

  // This component will redirect, so content won't be visible
  return null;
};

export default Sitemap;