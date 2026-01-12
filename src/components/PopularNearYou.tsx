import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import EventCard from "@/components/EventCard";
import { LoadingEventCard } from "@/components/LoadingStates";

interface LocationData {
  city: string | null;
  country: string | null;
  country_code: string | null;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  price: number;
  category: string;
  denominations: string;
  organizer: string;
}

const PopularNearYou = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);

  // Get user's IP and location
  useEffect(() => {
    const getLocation = async () => {
      try {
        // First, get user's IP address using a public API
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        if (ipData.ip) {
          // Call our edge function to get location data
          const { data, error } = await supabase.functions.invoke('get-visitor-location', {
            body: { ip: ipData.ip }
          });

          if (!error && data) {
            setLocation(data);
          }
        }
      } catch (error) {
        console.error('Error getting location:', error);
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, []);

  // Fetch events filtered by location
  useEffect(() => {
    const fetchNearbyEvents = async () => {
      if (locationLoading) return;
      
      setLoading(true);
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        const timeStr = new Date().toTimeString().slice(0, 8);
        
        const query = supabase
          .from("events")
          .select("id, slug, title, date, time, location, description, image, price, category, denominations, organizer")
          .eq("approval_status", "approved")
          .or(`date.gt.${dateStr},and(date.eq.${dateStr},time.gte.${timeStr})`)
          .order("date", { ascending: true })
          .limit(50);

        const { data, error } = await query;

        if (error) throw error;

        // Filter events by location (city match or country match)
        let filteredEvents = data || [];
        
        if (location?.city || location?.country) {
          const cityLower = location.city?.toLowerCase() || '';
          const countryLower = location.country?.toLowerCase() || '';
          
          // First try to find events in the same city
          const cityEvents = filteredEvents.filter(event => 
            event.location.toLowerCase().includes(cityLower)
          );
          
          // If not enough city events, add country events
          if (cityEvents.length < 4 && countryLower) {
            const countryEvents = filteredEvents.filter(event => 
              event.location.toLowerCase().includes(countryLower) ||
              event.location.toLowerCase().includes('uk') ||
              event.location.toLowerCase().includes('united kingdom') ||
              event.location.toLowerCase().includes('england') ||
              event.location.toLowerCase().includes('london') ||
              event.location.toLowerCase().includes('manchester') ||
              event.location.toLowerCase().includes('birmingham')
            );
            
            // Combine and deduplicate
            const combined = [...cityEvents];
            for (const event of countryEvents) {
              if (!combined.find(e => e.id === event.id)) {
                combined.push(event);
              }
            }
            filteredEvents = combined;
          } else {
            filteredEvents = cityEvents;
          }
        }

        // Deduplicate and limit to 4
        const seenEvents = new Set();
        const uniqueEvents = filteredEvents.filter((event) => {
          const normalizedTitle = event.title.toLowerCase().replace(/\s+/g, ' ').trim();
          const eventKey = `${normalizedTitle}|${event.date}`;
          
          if (seenEvents.has(eventKey)) return false;
          seenEvents.add(eventKey);
          return true;
        }).slice(0, 4);

        setEvents(uniqueEvents);
      } catch (error) {
        console.error('Error fetching nearby events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNearbyEvents();
  }, [location, locationLoading]);

  // Don't render if no location detected and no events
  if (!locationLoading && !location?.city && events.length === 0) {
    return null;
  }

  const locationDisplay = location?.city 
    ? `${location.city}${location.country ? `, ${location.country}` : ''}`
    : 'your area';

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-5 w-5 text-primary" />
              {locationLoading ? (
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Detecting location...
                </span>
              ) : (
                <span className="text-sm font-medium text-primary uppercase tracking-wide">
                  Near {locationDisplay}
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              Popular in Your Area
            </h2>
          </div>
          {events.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => navigate(`/events${location?.city ? `?location=${encodeURIComponent(location.city)}` : ''}`)}
              className="hidden sm:flex"
            >
              See more
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingEventCard key={index} />
            ))}
          </div>
        ) : events.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  {...event}
                  availableTickets={0}
                />
              ))}
            </div>
            
            {/* Mobile View More Button */}
            <div className="text-center mt-6 sm:hidden">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/events${location?.city ? `?location=${encodeURIComponent(location.city)}` : ''}`)}
                className="w-full"
              >
                See more events nearby
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8 bg-muted/30 rounded-xl">
            <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              No events found in your area yet.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/events')}
            >
              Browse all events
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default PopularNearYou;
