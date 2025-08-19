import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

// Generate a session ID for anonymous users
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export const useSiteTracking = (pageTitle?: string) => {
  const { user } = useAuth();

  useEffect(() => {
    const trackPageView = async () => {
      try {
        const pagePath = window.location.pathname;
        const sessionId = getSessionId();
        
        // Get visitor's approximate location
        let locationData = { country: null, country_code: null, city: null };
        try {
          // Get user's IP and fetch location data
          const response = await fetch('https://api.ipify.org?format=json');
          const { ip } = await response.json();
          
          const { data: location } = await supabase.functions.invoke('get-visitor-location', {
            body: { ip }
          });
          if (location && !location.error) {
            locationData = location;
          }
        } catch (locationError) {
          console.debug('Location detection failed:', locationError);
        }
        
        await supabase.rpc('increment_page_view', {
          page_path_param: pagePath,
          page_title_param: pageTitle || document.title,
          user_id_param: user?.id || null,
          session_id_param: sessionId,
          referrer_param: document.referrer || null,
          user_agent_param: navigator.userAgent,
          country_param: locationData.country,
          country_code_param: locationData.country_code,
          city_param: locationData.city,
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Page tracking error:', error);
      }
    };

    trackPageView();
  }, [user?.id, pageTitle]);
};

export const useBlogTracking = (blogPostId: string | undefined) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!blogPostId) return;

    const trackBlogView = async () => {
      try {
        const sessionId = getSessionId();
        
        await supabase.rpc('increment_blog_view', {
          blog_post_id_param: blogPostId,
          user_id_param: user?.id || null,
          session_id_param: sessionId,
        });
      } catch (error) {
        // Silently fail - don't disrupt user experience
        console.debug('Blog tracking error:', error);
      }
    };

    trackBlogView();
  }, [blogPostId, user?.id]);
};