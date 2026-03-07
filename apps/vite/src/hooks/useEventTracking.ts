import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useEventTracking = (eventId: string | undefined) => {
  useEffect(() => {
    if (!eventId) return;

    // Track event view
    const trackView = async () => {
      try {
        const { error } = await supabase.rpc('increment_event_view', { 
          event_id_param: eventId 
        });
        
        if (error) {
          console.error('Error tracking event view:', error);
        }
      } catch (error) {
        console.error('Error tracking event view:', error);
      }
    };

    // Track the view after a small delay to ensure the page has loaded
    const timeoutId = setTimeout(trackView, 1000);

    return () => clearTimeout(timeoutId);
  }, [eventId]);
};