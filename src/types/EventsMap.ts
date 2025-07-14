export interface Event {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  category?: string;
}

export interface EventsMapProps {
  events: Event[];
  onEventSelect?: (eventId: string) => void;
  userLocation?: { lat: number; lng: number } | null;
  onLocationUpdate?: (location: { lat: number; lng: number }) => void;
}

export interface MapLocation {
  lat: number;
  lng: number;
}