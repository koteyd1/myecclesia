import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventsMapProps } from '@/types/EventsMap';
import MapControls from './MapControls';
import { Loader } from '@googlemaps/js-api-loader';
import { supabase } from '@/integrations/supabase/client';

const EventsMap: React.FC<EventsMapProps> = ({ 
  events, 
  onEventSelect, 
  userLocation,
  onLocationUpdate 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { toast } = useToast();

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
        
        if (map) {
          map.setCenter(location);
          map.setZoom(12);
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

  // Initialize Google Maps directly
  useEffect(() => {
    const initMap = async () => {
      if (!mapContainer.current || isLoading || isLoaded) return;
      
      setIsLoading(true);
      console.log('🗺️ Starting direct Google Maps initialization...');

      try {
        // Get API key
        const { data: secretData, error: secretError } = await supabase.functions.invoke('get-google-maps-key');
        
        if (secretError || !secretData?.key) {
          throw new Error(`API key error: ${secretError?.message || 'No key returned'}`);
        }

        console.log('🔑 API key retrieved, loading Google Maps...');

        // Load Google Maps
        const loader = new Loader({
          apiKey: secretData.key,
          version: 'weekly',
          libraries: ['places']
        });

        await loader.load();
        console.log('✅ Google Maps API loaded');

        // Create map directly
        const center = userLocation || { lat: 51.5074, lng: -0.1278 };
        
        const googleMap = new google.maps.Map(mapContainer.current, {
          center: center,
          zoom: userLocation ? 12 : 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });

        console.log('✅ Google Maps instance created');
        setMap(googleMap);
        setIsLoaded(true);
        setIsLoading(false);

        // Add markers for events
        events.forEach(event => {
          // For now, use random coordinates near London for testing
          const eventLatLng = {
            lat: 51.5074 + (Math.random() - 0.5) * 0.1,
            lng: -0.1278 + (Math.random() - 0.5) * 0.1
          };

          const marker = new google.maps.Marker({
            position: eventLatLng,
            map: googleMap,
            title: event.title,
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `<div class="p-2"><strong>${event.title}</strong><br/>${event.location}</div>`
          });

          marker.addListener('click', () => {
            infoWindow.open(googleMap, marker);
            onEventSelect?.(event.id);
          });
        });

      } catch (error) {
        console.error('❌ Failed to initialize Google Maps:', error);
        setIsLoading(false);
        toast({
          title: "Map Error",
          description: `Failed to load Google Maps: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
      }
    };

    // Wait a moment for container to be ready
    const timer = setTimeout(initMap, 200);
    return () => clearTimeout(timer);
  }, [events, userLocation, onEventSelect, isLoading, isLoaded, toast]);

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center bg-muted/20 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
        <p className="text-sm text-muted-foreground text-center">
          Initializing Google Maps and loading event locations
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[50vh] flex flex-col border rounded-lg overflow-hidden">
      <MapControls onGetCurrentLocation={getCurrentLocation} />
      <div 
        ref={mapContainer}
        className="flex-1 w-full bg-gray-200"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '300px'
        }}
      />
    </div>
  );
};

export default EventsMap;