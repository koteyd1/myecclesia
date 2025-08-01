import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import EventsMap from "@/components/EventsMap";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useGeocoding } from "@/hooks/useGeocoding";
import { getMockCoordinates } from "@/utils/mapUtils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, X, ChevronDown, Calendar, MapPin, DollarSign, Users, Navigation } from "lucide-react";
import { LoadingEventCard } from "@/components/LoadingStates";

const Events = () => {
  const { toast } = useToast();
  const { geocodeLocation } = useGeocoding();
  const location = useLocation();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);
  const [showMapOnMobile, setShowMapOnMobile] = useState(false);

  const categoryOptions = [
    "Church Service",
    "Bible Study",
    "Prayer Meeting",
    "Youth Events",
    "Children's Ministry",
    "Community Outreach",
    "Missions",
    "Concerts and Festivals",
    "Camps and Retreats",
    "Conference",
    "Fellowship",
    "Worship and Music",
    "Tours",
    "Special Events",
    "Holiday Celebrations",
    "Educational",
    "Fundraising"
  ];

  const denominationOptions = [
    "Catholic",
    "Protestant",
    "Orthodox",
    "Baptist",
    "Methodist",
    "Presbyterian",
    "Lutheran",
    "Pentecostal",
    "Anglican",
    "Episcopal",
    "Evangelical",
    "Non-denominational",
    "Interfaith"
  ];

  useEffect(() => {
    // Skip cleanup and fetch events immediately for faster loading
    fetchEvents();
    // Run cleanup in background without waiting
    triggerCleanup();
  }, []);

  // Save scroll position when navigating away and restore when coming back
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('eventsScrollPosition');
    if (savedScrollPosition && location.state?.from === 'event-detail') {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScrollPosition, 10));
      }, 100);
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem('eventsScrollPosition', window.scrollY.toString());
    };

    const handleScroll = () => {
      sessionStorage.setItem('eventsScrollPosition', window.scrollY.toString());
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.state]);

  const triggerCleanup = async () => {
    try {
      console.log('Triggering automatic cleanup of past events...');
      const { data, error } = await supabase.functions.invoke('trigger-cleanup');
      
      if (error) {
        console.error('Cleanup error:', error);
        return;
      }
      
      console.log('Cleanup completed:', data);
    } catch (error) {
      console.error('Error triggering cleanup:', error);
      // Don't show error to user - this is a background operation
    }
  };

  const fetchEvents = useCallback(async () => {
    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      // Fetch only future events at database level for faster query
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte('date', today)
        .order("date", { ascending: true })
        .limit(20); // Initial batch for faster loading

      if (error) throw error;
      
      // Only filter by time for today's events to reduce processing
      const upcomingEvents = (data || []).filter(event => {
        if (event.date === today) {
          const eventDateTime = new Date(`${event.date}T${event.time}`);
          return eventDateTime > now;
        }
        return true; // Future dates are already filtered by the query
      });
      
      setEvents(upcomingEvents);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Memoized filtered events for performance
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Basic search - optimized with early returns
      if (searchTerm !== "") {
        const searchLower = searchTerm.toLowerCase();
        const titleMatch = event.title.toLowerCase().includes(searchLower);
        const descMatch = event.description?.toLowerCase().includes(searchLower);
        const locationMatch = event.location.toLowerCase().includes(searchLower);
        const organizerMatch = event.organizer?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descMatch && !locationMatch && !organizerMatch) return false;
      }

      // Quick filters
      if (selectedCategory !== "" && event.category !== selectedCategory) return false;
      if (selectedDenomination !== "" && !event.denominations?.includes(selectedDenomination)) return false;
      
      // Price filter
      if (priceFilter !== "") {
        const eventPrice = event.price || 0;
        if (priceFilter === "free" && eventPrice > 0) return false;
        if (priceFilter === "paid" && eventPrice === 0) return false;
      }

      // Advanced filters (only if they're set)
      if (startDate !== "" || endDate !== "") {
        const eventDate = new Date(event.date);
        if (startDate !== "" && eventDate < new Date(startDate)) return false;
        if (endDate !== "" && eventDate > new Date(endDate)) return false;
      }

      if (minPrice !== "" || maxPrice !== "") {
        const eventPrice = event.price || 0;
        if (minPrice !== "" && eventPrice < parseFloat(minPrice)) return false;
        if (maxPrice !== "" && eventPrice > parseFloat(maxPrice)) return false;
      }

      if (locationFilter !== "" && !event.location.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      
      if (availabilityFilter !== "") {
        const tickets = event.available_tickets || 0;
        if (availabilityFilter === "available" && tickets === 0) return false;
        if (availabilityFilter === "full" && tickets > 0) return false;
      }

      return true;
    });
  }, [events, searchTerm, selectedCategory, selectedDenomination, priceFilter, startDate, endDate, minPrice, maxPrice, locationFilter, availabilityFilter]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedDenomination("");
    setPriceFilter("");
    setStartDate("");
    setEndDate("");
    setMinPrice("");
    setMaxPrice("");
    setLocationFilter("");
    setAvailabilityFilter("");
  };

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "" || 
    selectedDenomination !== "" || priceFilter !== "" || startDate !== "" ||
    endDate !== "" || minPrice !== "" || maxPrice !== "" || locationFilter !== "" ||
    availabilityFilter !== "";

  // Simple distance calculation using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get event coordinates using the geocoding hook
  const getEventCoordinates = async (location: string): Promise<{ lat: number; lng: number }> => {
    const coords = await geocodeLocation(location);
    return coords || getMockCoordinates(location);
  };

  // Memoized sorted events for performance
  const sortedEvents = useMemo(() => {
    if (!sortByDistance || !userLocation) return filteredEvents;
    
    return [...filteredEvents].sort((a, b) => {
      const coordsA = getMockCoordinates(a.location);
      const coordsB = getMockCoordinates(b.location);
      const distanceA = calculateDistance(userLocation.lat, userLocation.lng, coordsA.lat, coordsA.lng);
      const distanceB = calculateDistance(userLocation.lat, userLocation.lng, coordsB.lat, coordsB.lng);
      return distanceA - distanceB;
    });
  }, [filteredEvents, sortByDistance, userLocation]);

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    // Scroll to the event card
    const eventElement = document.getElementById(`event-${eventId}`);
    if (eventElement) {
      eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleLocationUpdate = (location: { lat: number; lng: number }) => {
    setUserLocation(location);
    setSortByDistance(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">All Events</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Loading upcoming events...
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingEventCard key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">All Events</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover all upcoming events and activities at our church. Join us for worship, fellowship, and community outreach.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Basic Filter Controls */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {categoryOptions.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="free">Free Events</SelectItem>
                <SelectItem value="paid">Paid Events</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}

            {userLocation && (
              <Button
                variant={sortByDistance ? "default" : "outline"}
                size="sm"
                onClick={() => setSortByDistance(prev => !prev)}
                className="flex items-center gap-2"
              >
                <Navigation className="h-4 w-4" />
                Sort by Distance
              </Button>
            )}
          </div>

          {/* Advanced Filters */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="mx-auto flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Advanced Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-muted/20">
                
                {/* Date Range */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Date Range</label>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="date"
                      placeholder="Start Date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Price Range</label>
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Min Price"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      className="text-sm"
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Location</label>
                  </div>
                  <Input
                    placeholder="Search by location..."
                    value={locationFilter}
                    onChange={(e) => setLocationFilter(e.target.value)}
                    className="text-sm"
                  />
                </div>

                {/* Denomination */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Denomination</label>
                  <Select value={selectedDenomination} onValueChange={setSelectedDenomination}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All Denominations" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {denominationOptions.map((denomination) => (
                        <SelectItem key={denomination} value={denomination}>
                          {denomination}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Availability */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <label className="text-sm font-medium">Availability</label>
                  </div>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="All Events" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      <SelectItem value="available">Available Spots</SelectItem>
                      <SelectItem value="full">Fully Booked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {sortedEvents.length} of {events.length} events
              {hasActiveFilters && " (filtered)"}
              {sortByDistance && userLocation && " (sorted by distance)"}
            </p>
          </div>
        </div>

        {/* Mobile Map Toggle */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            onClick={() => setShowMapOnMobile(!showMapOnMobile)}
            className="w-full"
          >
            <MapPin className="h-4 w-4 mr-2" />
            {showMapOnMobile ? 'Hide Map' : 'Show Map'}
          </Button>
        </div>

        {/* Mobile Map */}
        {showMapOnMobile && (
          <div className="lg:hidden mb-6">
            <div className="bg-card border rounded-lg h-[300px] w-full">
              <EventsMap 
                events={sortedEvents}
                onEventSelect={handleEventSelect}
                userLocation={userLocation}
                onLocationUpdate={handleLocationUpdate}
              />
            </div>
          </div>
        )}

        {/* Main Content - Split Layout */}
        <div className="grid lg:grid-cols-3 gap-6 lg:h-[calc(100vh-400px)] lg:min-h-[600px]">
          {/* Events List - Left Side */}
          <div className="lg:col-span-2 space-y-4 lg:overflow-y-auto lg:pr-2">
            {sortedEvents.length > 0 ? (
              <div className="grid gap-6">
                {sortedEvents.map((event, index) => {
                  const distance = sortByDistance && userLocation 
                    ? calculateDistance(
                        userLocation.lat, 
                        userLocation.lng, 
                        getMockCoordinates(event.location).lat, 
                        getMockCoordinates(event.location).lng
                      ).toFixed(1)
                    : null;

                  return (
                    <div 
                      key={event.id} 
                      id={`event-${event.id}`}
                      className={`transition-all duration-200 ${
                        selectedEventId === event.id ? 'ring-2 ring-primary ring-offset-2' : ''
                      }`}
                    >
                      <EventCard 
                        id={event.id}
                        title={event.title}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        description={event.description}
                        image={event.image || "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop"}
                        price={event.price || 0}
                        availableTickets={event.available_tickets || 0}
                        category={event.category || "Event"}
                        denominations={event.denominations || ""}
                      />
                      {distance && (
                        <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                          <Navigation className="h-3 w-3" />
                          ~{distance} km away
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No events scheduled at this time.</p>
                <p className="text-muted-foreground">Check back soon for upcoming events!</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No events match your search criteria.</p>
                <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>

          {/* Map - Right Side - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1 sticky top-4 h-[500px]">
            <div className="bg-card border rounded-lg h-full w-full">
              <EventsMap 
                events={sortedEvents}
                onEventSelect={handleEventSelect}
                userLocation={userLocation}
                onLocationUpdate={handleLocationUpdate}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Events;