import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);
  const { toast } = useToast();

  // Mock geocoding function - in production, you'd use a real geocoding service
  const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
    // Simple mock geocoding for common locations
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
          map.current.flyTo({
            center: [location.lng, location.lat],
            zoom: 12
          });
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

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: userLocation ? [userLocation.lng, userLocation.lat] : [-74.0060, 40.7128],
      zoom: userLocation ? 12 : 10,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    map.current.on('load', () => {
      addEventMarkers();
    });
  };

  const addEventMarkers = async () => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Add user location marker if available
    if (userLocation) {
      const userMarker = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([userLocation.lng, userLocation.lat])
        .setPopup(new mapboxgl.Popup().setHTML('<div class="p-2"><strong>Your Location</strong></div>'))
        .addTo(map.current);
      
      markers.current.push(userMarker);
    }

    // Add event markers
    for (const event of events) {
      try {
        const coords = await geocodeLocation(event.location);
        if (coords && map.current) {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.style.cssText = `
            background-color: #ef4444;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 2px solid white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          `;
          el.innerHTML = '<div style="color: white; font-size: 12px; font-weight: bold;">📅</div>';
          
          const marker = new mapboxgl.Marker(el)
            .setLngLat([coords.lng, coords.lat])
            .setPopup(
              new mapboxgl.Popup()
                .setHTML(`
                  <div class="p-3 max-w-xs">
                    <h3 class="font-semibold text-sm mb-1">${event.title}</h3>
                    <p class="text-xs text-gray-600 mb-1">${event.location}</p>
                    <p class="text-xs text-gray-600 mb-2">${event.date} at ${event.time}</p>
                    ${event.category ? `<span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${event.category}</span>` : ''}
                  </div>
                `)
            )
            .addTo(map.current);

          el.addEventListener('click', () => {
            onEventSelect?.(event.id);
          });

          markers.current.push(marker);
        }
      } catch (error) {
        console.error(`Error geocoding location for event ${event.title}:`, error);
      }
    }
  };

  useEffect(() => {
    if (mapboxToken && !showTokenInput) {
      initializeMap();
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, showTokenInput]);

  useEffect(() => {
    if (map.current && !showTokenInput) {
      addEventMarkers();
    }
  }, [events, userLocation]);

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      setShowTokenInput(false);
      toast({
        title: "Map initialized",
        description: "Loading events on map...",
      });
    }
  };

  if (showTokenInput) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4 bg-muted/20 rounded-lg">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Setup Map</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center">
          Enter your Mapbox public token to display event locations on the map.
          Get your token from <a href="https://mapbox.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
        </p>
        <div className="w-full max-w-md space-y-3">
          <Input
            placeholder="Mapbox public token (pk.ey...)"
            value={mapboxToken}
            onChange={(e) => setMapboxToken(e.target.value)}
            type="password"
          />
          <Button onClick={handleTokenSubmit} className="w-full">
            Initialize Map
          </Button>
        </div>
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