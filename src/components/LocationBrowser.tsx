import { useNavigate } from "react-router-dom";
import { MapPin, Building2, Globe2, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface LocationData {
  city: string;
  country: string;
  count: number;
}

const LocationCard = ({ city, country, count, onClick }: { 
  city: string; 
  country: string; 
  count: number;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 w-full text-left"
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
        <MapPin className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{city}</p>
        <p className="text-sm text-muted-foreground truncate">{country}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
          {count}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
      </div>
    </button>
  );
};

const LocationBrowser = () => {
  const navigate = useNavigate();
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
          .from("events")
          .select("location")
          .gte("date", dateStr)
          .not("location", "is", null);

        if (error) throw error;

        // Parse locations to extract city and country
        const locationCounts: Record<string, { city: string; country: string; count: number }> = {};
        
        (data || []).forEach(event => {
          if (!event.location) return;
          
          // Parse location - assume format like "City, Country" or just "City"
          const parts = event.location.split(',').map(p => p.trim());
          let city = parts[0] || event.location;
          let country = parts.length > 1 ? parts[parts.length - 1] : '';
          
          // Clean up common patterns
          city = city.replace(/\d+/g, '').trim(); // Remove numbers
          
          // Skip if city is too short or looks like an address
          if (city.length < 3) return;
          
          const key = `${city}|${country}`.toLowerCase();
          
          if (locationCounts[key]) {
            locationCounts[key].count++;
          } else {
            locationCounts[key] = { city, country, count: 1 };
          }
        });

        // Sort by count and take top locations
        const sortedLocations = Object.values(locationCounts)
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        setLocations(sortedLocations);
      } catch (error) {
        console.error("Error fetching locations:", error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleLocationClick = (city: string) => {
    navigate(`/events?location=${encodeURIComponent(city)}`);
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <Skeleton className="h-8 w-64 mx-auto mb-3" />
            <Skeleton className="h-5 w-80 mx-auto" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (locations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Globe2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary uppercase tracking-wide">Find Local Events</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Browse by Location
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover events happening in cities near you
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {locations.map((loc, index) => (
            <LocationCard
              key={`${loc.city}-${loc.country}-${index}`}
              city={loc.city}
              country={loc.country}
              count={loc.count}
              onClick={() => handleLocationClick(loc.city)}
            />
          ))}
        </div>

        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => navigate("/events")}
            className="gap-2"
          >
            <Building2 className="h-4 w-4" />
            View All Locations
          </Button>
        </div>
      </div>
    </section>
  );
};

export default LocationBrowser;
