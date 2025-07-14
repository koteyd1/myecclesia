import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MapLocation } from '@/types/EventsMap';
import { getMockCoordinates } from '@/utils/mapUtils';

export const useGeocoding = () => {
  const geocodeLocation = useCallback(async (location: string): Promise<MapLocation | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: { address: location }
      });

      if (error) {
        console.warn(`Geocoding failed for location: ${location}`, error);
        return getMockCoordinates(location);
      }

      if (data && data.lat && data.lng) {
        return { lat: data.lat, lng: data.lng };
      } else {
        console.warn(`No coordinates returned for location: ${location}`);
        return getMockCoordinates(location);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      return getMockCoordinates(location);
    }
  }, []);

  return { geocodeLocation };
};