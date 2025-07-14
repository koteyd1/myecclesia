import { useState, useCallback, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';
import { MapLocation, Event } from '@/types/EventsMap';
import { useGeocoding } from './useGeocoding';
import { createEventInfoWindowContent } from '@/utils/mapUtils';
import { useToast } from '@/hooks/use-toast';

/// <reference types="@types/google.maps" />

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const { geocodeLocation } = useGeocoding();
  const { toast } = useToast();

  const initializeMap = useCallback(async (
    container: HTMLDivElement,
    userLocation?: MapLocation | null
  ) => {
    try {
      // Get Google Maps API key from Supabase secrets
      const { data: secretData, error: secretError } = await supabase.functions.invoke('get-google-maps-key');
      
      if (secretError || !secretData?.key) {
        console.warn('Could not get Google Maps API key from secrets');
        setIsLoading(false);
        return;
      }

      const loader = new Loader({
        apiKey: secretData.key,
        version: 'weekly',
        libraries: ['marker']
      });

      await loader.load();

      const center = userLocation || { lat: 40.7128, lng: -74.0060 };
      
      map.current = new google.maps.Map(container, {
        center: center,
        zoom: userLocation ? 12 : 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      setIsLoaded(true);
      setIsLoading(false);

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setIsLoading(false);
      toast({
        title: "Map loading error",
        description: "Could not load Google Maps. Please check your API key.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const clearMarkers = useCallback(() => {
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];
  }, []);

  const addUserLocationMarker = useCallback((userLocation: MapLocation) => {
    if (!map.current || !isLoaded) return;

    const userMarker = new google.maps.Marker({
      position: userLocation,
      map: map.current,
      title: 'Your Location',
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      }
    });

    const userInfoWindow = new google.maps.InfoWindow({
      content: '<div class="p-2"><strong>Your Location</strong></div>'
    });

    userMarker.addListener('click', () => {
      userInfoWindow.open(map.current, userMarker);
    });

    markers.current.push(userMarker);
  }, [isLoaded]);

  const addEventMarkers = useCallback(async (
    events: Event[],
    onEventSelect?: (eventId: string) => void
  ) => {
    if (!map.current || !isLoaded) return;

    for (const event of events) {
      try {
        const coords = await geocodeLocation(event.location);
        if (coords && map.current) {
          const eventMarker = new google.maps.Marker({
            position: coords,
            map: map.current,
            title: event.title,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: '#ef4444',
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: createEventInfoWindowContent(event)
          });

          eventMarker.addListener('click', () => {
            infoWindow.open(map.current, eventMarker);
            onEventSelect?.(event.id);
          });

          markers.current.push(eventMarker);
        }
      } catch (error) {
        console.error(`Error geocoding location for event ${event.title}:`, error);
      }
    }
  }, [isLoaded, geocodeLocation]);

  const centerMapOnLocation = useCallback((location: MapLocation) => {
    if (map.current) {
      map.current.setCenter(location);
      map.current.setZoom(12);
    }
  }, []);

  return {
    isLoaded,
    isLoading,
    initializeMap,
    clearMarkers,
    addUserLocationMarker,
    addEventMarkers,
    centerMapOnLocation
  };
};