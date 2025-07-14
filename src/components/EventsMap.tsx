import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

/// <reference types="@types/google.maps" />

interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  category?: string;
}

interface EventsMapProps {
  events: Event[];
  onEventSelect?: (eventId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

const EventsMap: React.FC<EventsMapProps> = ({ 
  events, 
  onEventSelect, 
  userLocation,
  onLocationUpdate 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Google Geocoding through Supabase Edge Function
  const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
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
  };

  // Fallback mock geocoding for demo/development
  const getMockCoordinates = (location: string): { lat: number; lng: number } => {
    const locationMocks: { [key: string]: { lat: number; lng: number } } = {
      'downtown': { lat: 40.7831, lng: -73.9712 },
      'main street': { lat: 40.7589, lng: -73.9851 },
      'city center': { lat: 40.7505, lng: -73.9934 },
      'central park': { lat: 40.7829, lng: -73.9654 },
      'times square': { lat: 40.7580, lng: -73.9855 },
    };

    const lowerLocation = location.toLowerCase();
    for (const [key, coords] of Object.entries(locationMocks)) {
      if (lowerLocation.includes(key)) {
        return coords;
      }
    }

    // Return random coordinates around NYC area for demo
    return {
      lat: 40.7128 + (Math.random() - 0.5) * 0.1,
      lng: -74.0060 + (Math.random() - 0.5) * 0.1
    };
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        onLocationUpdate?.(location);
        
        if (map.current) {
          map.current.setCenter(location);
          map.current.setZoom(12);
        }

        toast({
          title: "Location found",
          description: "Map centered on your location",
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast({
          title: "Location error",
          description: "Could not get your location",
          variant: "destructive",
        });
      }
    );
  };

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    try {
      // Get Google Maps API key from Supabase secrets
      const { data: secretData, error: secretError } = await supabase.functions.invoke('get-google-maps-key');
      
      let apiKey = '';
      if (secretError || !secretData?.key) {
        // Fallback - you might want to handle this differently
        console.warn('Could not get Google Maps API key from secrets');
        return;
      } else {
        apiKey = secretData.key;
      }

      const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        libraries: ['marker']
      });

      await loader.load();

      const center = userLocation || { lat: 40.7128, lng: -74.0060 };
      
      map.current = new google.maps.Map(mapContainer.current, {
        center: center,
        zoom: userLocation ? 12 : 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      setIsLoaded(true);
      setIsLoading(false);
      
      // Add markers after map is initialized
      addEventMarkers();

    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setIsLoading(false);
      toast({
        title: "Map loading error",
        description: "Could not load Google Maps. Please check your API key.",
        variant: "destructive",
      });
    }
  };

  const addEventMarkers = async () => {
    if (!map.current || !isLoaded) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.setMap(null));
    markers.current = [];

    // Add user location marker if available
    if (userLocation) {
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
    }

    // Add event markers
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
            content: `
              <div class="p-3 max-w-xs">
                <h3 class="font-semibold text-sm mb-1">${event.title}</h3>
                <p class="text-xs text-gray-600 mb-1">${event.location}</p>
                <p class="text-xs text-gray-600 mb-2">${event.date} at ${event.time}</p>
                ${event.category ? `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${event.category}</span>` : ''}
              </div>
            `
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
  };

  useEffect(() => {
    initializeMap();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      addEventMarkers();
    }
  }, [events, userLocation, isLoaded]);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
        <p className="text-sm text-muted-foreground text-center">
          Initializing Google Maps and loading event locations
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">Event Locations</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={getCurrentLocation}
          className="flex items-center gap-1"
        >
          <Navigation className="h-4 w-4" />
          My Location
        </Button>
      </div>
      <div ref={mapContainer} className="flex-1 rounded-b-lg overflow-hidden" />
    </div>
  );
};

export default EventsMap;