import React, { useEffect, useRef } from 'react';
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

  // Initialize map when component mounts
  useEffect(() => {
    if (mapContainer.current) {
      console.log('🎯 Initializing map...');
      initializeMap(mapContainer.current, userLocation);
    }
  }, [initializeMap, userLocation]);

  // Update markers when events or user location changes
  useEffect(() => {
    if (isLoaded) {
      console.log('🎯 Updating markers...');
      clearMarkers();
      
      // Add user location marker if available
      if (userLocation) {
        addUserLocationMarker(userLocation);
      }
      
      // Add event markers
      addEventMarkers(events, onEventSelect);
    }
  }, [events, userLocation, isLoaded, clearMarkers, addUserLocationMarker, addEventMarkers, onEventSelect]);

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
      <MapControls onGetCurrentLocation={getCurrentLocation} />
      <div 
        ref={mapContainer} 
        className="flex-1 min-h-[500px]" 
        style={{ height: 'calc(100% - 60px)' }}
      />
    </div>
  );
};

export default EventsMap;