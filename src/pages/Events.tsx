import { useEffect, useState } from "react";
import Header from "@/components/Header";
import EventCard from "@/components/EventCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, X } from "lucide-react";

const Events = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState("");
  const [priceFilter, setPriceFilter] = useState("");

  const categoryOptions = [
    "Worship Service",
    "Bible Study",
    "Prayer Meeting",
    "Youth Events",
    "Children's Ministry",
    "Community Outreach",
    "Missions",
    "Conferences",
    "Retreats",
    "Camps",
    "Fellowship",
    "Music Ministry",
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
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
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
    const matchesSearch = searchTerm === "" || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "" || event.category === selectedCategory;
    
    const matchesDenomination = selectedDenomination === "" || 
      event.denominations?.includes(selectedDenomination);

    const matchesPrice = priceFilter === "" || 
      (priceFilter === "free" && (event.price === 0 || event.price === null)) ||
      (priceFilter === "paid" && event.price > 0);

    return matchesSearch && matchesCategory && matchesDenomination && matchesPrice;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedDenomination("");
    setPriceFilter("");
  };

  const hasActiveFilters = searchTerm !== "" || selectedCategory !== "" || 
    selectedDenomination !== "" || priceFilter !== "";

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

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filters:</span>
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

            <Select value={selectedDenomination} onValueChange={setSelectedDenomination}>
              <SelectTrigger className="w-48">
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
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Count */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEvents.length} of {events.length} events
              {hasActiveFilters && " (filtered)"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredEvents.map((event) => (
            <EventCard 
              key={event.id} 
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
          ))}
        </div>

        {filteredEvents.length === 0 && events.length > 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No events match your search criteria.</p>
            <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
          </div>
        )}

        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No events scheduled at this time.</p>
            <p className="text-muted-foreground">Check back soon for upcoming events!</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Events;