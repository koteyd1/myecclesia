import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { EventsMapProps } from '@/types/EventsMap';
import MapControls from './MapControls';

const EventsMap: React.FC<EventsMapProps> = ({ 
  events, 
  onEventSelect, 
  userLocation,
  onLocationUpdate 
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [containerReady, setContainerReady] = useState(false);
  const { toast } = useToast();
  const {
    isLoaded,
    isLoading,
    initializeMap,
    clearMarkers,
    addUserLocationMarker,
    addEventMarkers,
    centerMapOnLocation
  } = useGoogleMaps();

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
        centerMapOnLocation(location);

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

  // Check container dimensions and mark as ready
  useEffect(() => {
    const checkContainer = () => {
      if (mapContainer.current) {
        const rect = mapContainer.current.getBoundingClientRect();
        console.log('📏 Checking container:', rect);
        
        if (rect.width > 0 && rect.height > 0) {
          console.log('✅ Container ready with dimensions:', rect.width, 'x', rect.height);
          setContainerReady(true);
        } else {
          console.log('⚠️ Container not ready, retrying...');
          setTimeout(checkContainer, 100);
        }
      }
    };

    // Small delay to ensure DOM is rendered
    setTimeout(checkContainer, 50);
  }, []);

  // Initialize map when container is ready
  useEffect(() => {
    if (containerReady && mapContainer.current) {
      console.log('🗺️ Initializing map with ready container');
      initializeMap(mapContainer.current, userLocation);
    }
  }, [containerReady, initializeMap, userLocation]);

  // Update markers when map is loaded
  useEffect(() => {
    if (isLoaded) {
      console.log('🎯 Updating markers...');
      clearMarkers();
      
      if (userLocation) {
        addUserLocationMarker(userLocation);
      }
      
      addEventMarkers(events, onEventSelect);
    }
  }, [events, userLocation, isLoaded, clearMarkers, addUserLocationMarker, addEventMarkers, onEventSelect]);

  if (isLoading) {
    return (
      <div className="w-full h-[500px] flex flex-col items-center justify-center bg-muted/20 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold mb-2">Loading Map...</h3>
        <p className="text-sm text-muted-foreground text-center">
          Initializing Google Maps and loading event locations
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-[600px] flex flex-col border">
      <MapControls onGetCurrentLocation={getCurrentLocation} />
      <div 
        ref={mapContainer}
        className="flex-1 w-full"
        style={{
          width: '100%',
          height: '540px', // 600px - 60px for controls
          minHeight: '540px',
          backgroundColor: '#e5e7eb'
        }}
      />
    </div>
  );
};

export default EventsMap;