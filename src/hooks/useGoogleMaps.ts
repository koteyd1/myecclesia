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
  const [isLoading, setIsLoading] = useState(false);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const { geocodeLocation } = useGeocoding();
  const { toast } = useToast();

  const initializeMap = useCallback(async (
    container: HTMLDivElement,
    userLocation?: MapLocation | null
  ) => {
    if (isLoaded || isLoading) {
      console.log('Map already loaded or loading, skipping initialization');
      return;
    }

    console.log('🗺️ Starting Google Maps initialization...');
    setIsLoading(true);
    
    try {
      // Get API key from Supabase
      console.log('🔑 Fetching Google Maps API key...');
      const { data: secretData, error: secretError } = await supabase.functions.invoke('get-google-maps-key');
      
      if (secretError || !secretData?.key) {
        throw new Error(`API key error: ${secretError?.message || 'No key returned'}`);
      }

      console.log('✅ API key retrieved, loading Google Maps...');
      
      // Load Google Maps
      const loader = new Loader({
        apiKey: secretData.key,
        version: 'weekly',
        libraries: ['marker']
      });

      await loader.load();
      console.log('✅ Google Maps API loaded');

      // Create map
      const center = userLocation || { lat: 51.5074, lng: -0.1278 }; // Default to London
      
      // Create map with explicit dimensions
      console.log('📏 Container dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
      });

      if (container.offsetWidth === 0 || container.offsetHeight === 0) {
        throw new Error('Container has zero dimensions');
      }

      map.current = new google.maps.Map(container, {
        center: center,
        zoom: userLocation ? 12 : 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        backgroundColor: '#f0f0f0', // Make sure we see something
      });

      console.log('✅ Google Maps instance created');
      
      // Wait for map to be ready before marking as loaded
      google.maps.event.addListenerOnce(map.current, 'idle', () => {
        console.log('✅ Map is idle and ready');
        setIsLoaded(true);
        setIsLoading(false);
      });
      
      // Force immediate resize
      setTimeout(() => {
        if (map.current) {
          google.maps.event.trigger(map.current, 'resize');
          map.current.setCenter(center);
          console.log('✅ Map resized and centered');
        }
      }, 200);

    } catch (error) {
      console.error('❌ Google Maps initialization failed:', error);
      setIsLoading(false);
      toast({
        title: "Map Error",
        description: `Failed to load Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  }, [isLoaded, isLoading, toast]);

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