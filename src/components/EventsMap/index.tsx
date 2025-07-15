import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EventsMapProps } from '@/types/EventsMap';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
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

  useEffect(() => {
    const loadMap = async () => {
      if (!mapContainer.current) return;
      
      await initializeMap(mapContainer.current, userLocation);
    };

    loadMap();
  }, [initializeMap, userLocation]);

  useEffect(() => {
    if (isLoaded && events.length > 0) {
      clearMarkers();
      
      if (userLocation) {
        addUserLocationMarker(userLocation);
      }
      
      addEventMarkers(events, onEventSelect);
    }
  }, [isLoaded, events, userLocation, onEventSelect, clearMarkers, addUserLocationMarker, addEventMarkers]);

  return (
    <div className="w-full h-[85vh] flex flex-col border rounded-lg overflow-hidden">
      <MapControls onGetCurrentLocation={getCurrentLocation} />
      <div 
        ref={mapContainer}
        className="flex-1 w-full"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          backgroundColor: '#f3f4f6'
        }}
      />
    </div>
  );
};

export default EventsMap;