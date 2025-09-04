import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  useSiteTracking("Events - myEcclesia");
  
  // Initialize state from URL parameters
  const urlParams = new URLSearchParams(location.search);
  const [searchTerm, setSearchTerm] = useState(urlParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(urlParams.get("category") || "");
  const [selectedDenomination, setSelectedDenomination] = useState(urlParams.get("denomination") || "");
  const [priceFilter, setPriceFilter] = useState(urlParams.get("price") || "");
  const [startDate, setStartDate] = useState(urlParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(urlParams.get("endDate") || "");
  const [minPrice, setMinPrice] = useState(urlParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(urlParams.get("maxPrice") || "");
  const [locationFilter, setLocationFilter] = useState(urlParams.get("location") || "");
  const [availabilityFilter, setAvailabilityFilter] = useState(urlParams.get("availability") || "");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(parseInt(urlParams.get("page") || "1"));
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

  // Function to update URL with current filter state
  const updateURL = useCallback((filters: Record<string, string>, page = 1) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (page > 1) params.set("page", page.toString());
    
    const newSearch = params.toString();
    const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
    navigate(newUrl, { replace: true });
  }, [location.pathname, navigate]);

  // Debounced search function - only handles URL update, not state
  const debouncedSearch = useMemo(
    () => performanceUtils.debounce((term: string) => {
      setCurrentPage(1);
      updateURL({
        search: term,
        category: selectedCategory,
        denomination: selectedDenomination,
        price: priceFilter,
        startDate,
        endDate,
        minPrice,
        maxPrice,
        location: locationFilter,
        availability: availabilityFilter
      }, 1);
    }, 300),
    [selectedCategory, selectedDenomination, priceFilter, startDate, endDate, minPrice, maxPrice, locationFilter, availabilityFilter, updateURL]
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

  // Effect to sync state with URL parameters when navigating back
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    setSearchTerm(urlParams.get("search") || "");
    setSelectedCategory(urlParams.get("category") || "");
    setSelectedDenomination(urlParams.get("denomination") || "");
    setPriceFilter(urlParams.get("price") || "");
    setStartDate(urlParams.get("startDate") || "");
    setEndDate(urlParams.get("endDate") || "");
    setMinPrice(urlParams.get("minPrice") || "");
    setMaxPrice(urlParams.get("maxPrice") || "");
    setLocationFilter(urlParams.get("location") || "");
    setAvailabilityFilter(urlParams.get("availability") || "");
    setCurrentPage(parseInt(urlParams.get("page") || "1"));
  }, [location.search]);

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
    updateURL({}, 1);
  }, [updateURL]);

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

  // Update URL when any filter changes
  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
    updateURL({
      search: searchTerm,
      category: selectedCategory,
      denomination: selectedDenomination,
      price: priceFilter,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      location: locationFilter,
      availability: availabilityFilter
    }, 1);
  }, [searchTerm, selectedCategory, selectedDenomination, priceFilter, startDate, endDate, minPrice, maxPrice, locationFilter, availabilityFilter, updateURL]);

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    updateURL({
      search: searchTerm,
      category: selectedCategory,
      denomination: selectedDenomination,
      price: priceFilter,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      location: locationFilter,
      availability: availabilityFilter
    }, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchTerm, selectedCategory, selectedDenomination, priceFilter, startDate, endDate, minPrice, maxPrice, locationFilter, availabilityFilter, updateURL]);

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
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value); // Update state immediately for UI
                debouncedSearch(value); // Debounce the URL update
              }}
              className="pl-10"
            />
          </div>

          {/* Basic Filter Controls */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center items-center">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Quick Filters:</span>
            </div>
            
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setTimeout(handleFilterChange, 0); }}>
              <SelectTrigger className="w-full sm:w-48">
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

            <Select value={priceFilter} onValueChange={(value) => { setPriceFilter(value); setTimeout(handleFilterChange, 0); }}>
              <SelectTrigger className="w-full sm:w-36">
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
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            )}

          </div>

          {/* Advanced Filters */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="mx-auto flex items-center gap-2 w-full sm:w-auto">
                <Filter className="h-4 w-4" />
                Advanced Filters
                <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border border-border rounded-lg bg-muted/20">
                
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
                      onChange={(e) => { setStartDate(e.target.value); setTimeout(handleFilterChange, 0); }}
                      className="text-sm"
                    />
                    <Input
                      type="date"
                      placeholder="End Date"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setTimeout(handleFilterChange, 0); }}
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
                      onChange={(e) => { setMinPrice(e.target.value); setTimeout(handleFilterChange, 0); }}
                      min="0"
                      step="0.01"
                      className="text-sm"
                    />
                    <Input
                      type="number"
                      placeholder="Max Price"
                      value={maxPrice}
                      onChange={(e) => { setMaxPrice(e.target.value); setTimeout(handleFilterChange, 0); }}
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
                    onChange={(e) => { setLocationFilter(e.target.value); setTimeout(handleFilterChange, 0); }}
                    className="text-sm"
                  />
                </div>

                {/* Denomination */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Denomination</label>
                  <Select value={selectedDenomination} onValueChange={(value) => { setSelectedDenomination(value); setTimeout(handleFilterChange, 0); }}>
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
                  <Select value={availabilityFilter} onValueChange={(value) => { setAvailabilityFilter(value); setTimeout(handleFilterChange, 0); }}>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-8">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-2 w-full sm:w-auto"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
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
                        className="w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm flex-shrink-0"
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
                  className="flex items-center gap-2 w-full sm:w-auto"
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
