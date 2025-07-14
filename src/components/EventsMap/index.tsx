import React, { useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
      if (!mapContainer.current) {
        console.log('❌ No map container');
        return;
      }

      try {
        console.log('🔑 Loading Google Maps with direct script...');
        
        // Load Google Maps API directly
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyBDkQO17iBT0aY-cJgCQPERDIAjeY3Ol38&libraries=places`;
        script.async = true;
        
        script.onload = () => {
          console.log('✅ Google Maps script loaded');
          
          if (!mapContainer.current) {
            console.log('❌ Container missing after script load');
            return;
          }

          // Create the map
          const map = new google.maps.Map(mapContainer.current, {
            center: { lat: 51.5074, lng: -0.1278 }, // London
            zoom: 10,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true,
          });

          console.log('✅ Google Maps created successfully!');

          // Add some test markers for the events
          events.slice(0, 5).forEach((event, index) => {
            const latLng = {
              lat: 51.5074 + (Math.random() - 0.5) * 0.2,
              lng: -0.1278 + (Math.random() - 0.5) * 0.2
            };

            const marker = new google.maps.Marker({
              position: latLng,
              map: map,
              title: event.title,
            });

            const infoWindow = new google.maps.InfoWindow({
              content: `
                <div class="p-3 max-w-xs">
                  <h3 class="font-bold text-lg">${event.title}</h3>
                  <p class="text-sm text-gray-600 mt-1">${event.location}</p>
                  <p class="text-sm font-semibold mt-2">
                    ${event.date} at ${event.time}
                  </p>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open(map, marker);
              onEventSelect?.(event.id);
            });
          });
        };

        script.onerror = () => {
          console.error('❌ Failed to load Google Maps script');
          toast({
            title: "Map Error",
            description: "Failed to load Google Maps",
            variant: "destructive",
          });
        };

        document.head.appendChild(script);

      } catch (error) {
        console.error('❌ Map loading error:', error);
        toast({
          title: "Map Error",
          description: "Failed to initialize map",
          variant: "destructive",
        });
      }
    };

    // Load map after a short delay
    setTimeout(loadMap, 500);
  }, [events, onEventSelect, toast]);

  return (
    <div className="w-full h-[70vh] flex flex-col border rounded-lg overflow-hidden">
      <MapControls onGetCurrentLocation={getCurrentLocation} />
      <div 
        ref={mapContainer}
        className="flex-1 w-full"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '500px',
          backgroundColor: '#f3f4f6'
        }}
      />
    </div>
  );
};

export default EventsMap;