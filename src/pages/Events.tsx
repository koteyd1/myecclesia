import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import EventCard from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, Filter, X, ChevronDown, Calendar, MapPin, DollarSign, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { useCache } from "@/utils/cache";
import { performanceUtils } from "@/utils/performance";
import { useSiteTracking } from "@/hooks/useSiteTracking";

const Events = () => {
  const { toast } = useToast();
  const location = useLocation();
  useSiteTracking("Events - myEcclesia");
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
  const [currentPage, setCurrentPage] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const eventsPerPage = 30;

  // Use cached events data
  const { data: events = [], loading, error } = useCache(
    'events-page',
    async () => {
      // Trigger cleanup first
      try {
        await supabase.functions.invoke('trigger-cleanup');
      } catch (error) {
        console.warn('Cleanup failed:', error);
      }

      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, date, time, location, description, image, price, category, denominations, organizer, available_tickets")
        .order("date", { ascending: true });

      if (error) throw error;
      
      // Filter out events that have already passed their start time
      const now = new Date();
      
      const upcomingEvents = (data || []).filter(event => {
        const eventDateTime = new Date(`${event.date}T${event.time}`);
        return eventDateTime > now;
      });
      
      return upcomingEvents;
    },
    {
      ttl: 2 * 60 * 1000, // Cache for 2 minutes
    }
  );

  // Debounced search function
  const debouncedSearch = useMemo(
    () => performanceUtils.debounce((term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
    }, 300),
    []
  );

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

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Memoize the duplicate removal and filtering for performance
  const filteredEvents = useMemo(() => {
    // Return empty array if events is null or undefined
    if (!events || !Array.isArray(events)) {
      return [];
    }

    // Remove duplicates based on title and date
    const removeDuplicates = (events: any[]) => {
      const seen = new Set();
      return events.filter(event => {
        const key = `${event.title.toLowerCase()}-${event.date}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });
    };

    const uniqueEvents = removeDuplicates(events);

    return uniqueEvents.filter((event) => {
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
  }, [events, searchTerm, selectedCategory, selectedDenomination, priceFilter, 
      startDate, endDate, minPrice, maxPrice, locationFilter, availabilityFilter]);

  const clearFilters = useCallback(() => {
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
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => 
    searchTerm !== "" || selectedCategory !== "" || 
    selectedDenomination !== "" || priceFilter !== "" || startDate !== "" ||
    endDate !== "" || minPrice !== "" || maxPrice !== "" || locationFilter !== "" ||
    availabilityFilter !== "",
    [searchTerm, selectedCategory, selectedDenomination, priceFilter, startDate, 
     endDate, minPrice, maxPrice, locationFilter, availabilityFilter]
  );

  // Use filtered events directly
  const sortedEvents = filteredEvents;

  // Memoize pagination calculations
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(sortedEvents.length / eventsPerPage);
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    const currentEvents = sortedEvents.slice(startIndex, endIndex);
    
    return { totalPages, startIndex, endIndex, currentEvents };
  }, [sortedEvents, currentPage, eventsPerPage]);

  const { totalPages, startIndex, endIndex, currentEvents } = paginationData;

  // Reset to first page when filters change and scroll to top when page changes
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-lg">Loading events...</div>
          </div>
        </div>
      </div>
    );
  }

  // Generate events schema for better SEO
  const eventsSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Christian Events in the UK",
    "description": "Upcoming Christian events, conferences, and church gatherings across the United Kingdom",
    "numberOfItems": filteredEvents.length,
    "itemListElement": filteredEvents.slice(0, 10).map((event, index) => ({
      "@type": "Event",
      "position": index + 1,
      "name": event.title,
      "description": event.description,
      "startDate": `${event.date}T${event.time}`,
      "location": {
        "@type": "Place",
        "name": event.location,
        "address": event.location
      },
      "offers": {
        "@type": "Offer",
        "price": event.price || 0,
        "priceCurrency": "GBP",
        "availability": (event.available_tickets || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut"
      },
      "organizer": {
        "@type": "Organization",
        "name": event.organizer || "MyEcclesia"
      }
    }))
  };

  return (
    <>
      <SEOHead 
        title="Christian Events UK – Book Tickets | MyEcclesia"
        description="Browse and book tickets for Christian events across the UK. Find conferences, worship nights, retreats, and church gatherings in your area."
        keywords="Christian events UK, church events, conference tickets, worship nights, Christian conferences, faith events"
        canonicalUrl="https://myecclesia.com/events"
      />
      <div className="min-h-screen bg-background">
        <StructuredData data={eventsSchema} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNav />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Christian Events UK</h1>
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
              onChange={(e) => debouncedSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Basic Filter Controls */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
            </div>
            
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); handleFilterChange(); }}>
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

            <Select value={priceFilter} onValueChange={(value) => { setPriceFilter(value); handleFilterChange(); }}>
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
                onClick={() => { clearFilters(); handleFilterChange(); }}
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
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {startIndex + 1}-{Math.min(endIndex, sortedEvents.length)} of {sortedEvents.length} events
              {hasActiveFilters && " (filtered)"}
            </p>
            <p className="text-xs text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Events List */}
          <div className="space-y-4">
            {currentEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentEvents.map((event) => (
                  <div key={event.id} id={`event-${event.id}`}>
                     <EventCard 
                       id={event.id}
                       slug={event.slug}
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
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {hasActiveFilters ? "No events match your filters." : "No events available."}
                </p>
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-10 h-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default Events;
