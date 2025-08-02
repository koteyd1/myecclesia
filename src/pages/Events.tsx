import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, X, ChevronDown, Calendar, MapPin, DollarSign, Users } from "lucide-react";

const Events = () => {
  const { toast } = useToast();
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
    // Trigger cleanup first, then fetch events
    triggerCleanup().then(() => {
      fetchEvents();
    });
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

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      
      // Filter out events that have already passed their start time
      const now = new Date();
      console.log("Current time:", now.toISOString());
      console.log("Raw events from database:", data?.length);
      
      const upcomingEvents = (data || []).filter(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        const isUpcoming = eventDateTime > now;
        console.log(`Event "${event.title}" at ${eventDateTime.toISOString()} - Upcoming: ${isUpcoming}`);
        return isUpcoming;
      });
      
      console.log("Filtered upcoming events:", upcomingEvents.length);
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
  };

  // Filter events based on search term and filters
  const filteredEvents = events.filter((event) => {
    // Basic search
    const matchesSearch = searchTerm === "" || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.organizer?.toLowerCase().includes(searchTerm.toLowerCase());

    // Category filter
    const matchesCategory = selectedCategory === "" || event.category === selectedCategory;
    
    // Denomination filter
    const matchesDenomination = selectedDenomination === "" || 
      event.denominations?.includes(selectedDenomination);

    // Price filter
    const matchesPrice = priceFilter === "" || 
      (priceFilter === "free" && (event.price === 0 || event.price === null)) ||
      (priceFilter === "paid" && event.price > 0);

    // Date range filter
    const eventDate = new Date(event.date);
    const matchesStartDate = startDate === "" || eventDate >= new Date(startDate);
    const matchesEndDate = endDate === "" || eventDate <= new Date(endDate);

    // Price range filter
    const eventPrice = event.price || 0;
    const matchesMinPrice = minPrice === "" || eventPrice >= parseFloat(minPrice);
    const matchesMaxPrice = maxPrice === "" || eventPrice <= parseFloat(maxPrice);

    // Location filter
    const matchesLocation = locationFilter === "" || 
      event.location.toLowerCase().includes(locationFilter.toLowerCase());

    // Availability filter
    const matchesAvailability = availabilityFilter === "" ||
      (availabilityFilter === "available" && (event.available_tickets || 0) > 0) ||
      (availabilityFilter === "full" && (event.available_tickets || 0) === 0);

    return matchesSearch && matchesCategory && matchesDenomination && matchesPrice &&
           matchesStartDate && matchesEndDate && matchesMinPrice && matchesMaxPrice &&
           matchesLocation && matchesAvailability;
  });

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

  // Use filtered events directly without distance sorting
  const sortedEvents = filteredEvents;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-lg">Loading events...</div>
          </div>
        </div>
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
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Events List */}
          <div className="space-y-4">
            {sortedEvents.length > 0 ? (
              <div className="grid gap-6">
                {sortedEvents.map((event) => (
                  <div key={event.id} id={`event-${event.id}`}>
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
                  </div>
                ))}
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
        </div>
      </main>
    </div>
  );
};

export default Events;