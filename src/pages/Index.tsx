import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import EventCard from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Heart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { StructuredData, createOrganizationSchema } from "@/components/StructuredData";
import { SEOOptimizations } from "@/components/SEOOptimizations";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingEventCard } from "@/components/LoadingStates";
import { SEOHead } from "@/components/SEOHead";
import { useCache } from "@/utils/cache";
import { performanceUtils } from "@/utils/performance";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All Events");

  // Use cached events data
  const { data: events = [], loading, error } = useCache(
    'homepage-events',
    async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, time, location, description, image, price, category, denominations, organizer")
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(12);

      if (error) throw error;
      
      // Filter out events that have already passed their start time
      const now = new Date();
      
      if (!data || data.length === 0) {
        return [];
      }
      
      const upcomingEvents = data.filter(event => {
        const eventDate = new Date(event.date);
        const [hours, minutes] = event.time.split(':').map(Number);
        eventDate.setHours(hours, minutes, 0, 0);
        
        // Show events that are in the future
        return eventDate > now;
      });
      
      // Remove duplicates based on event ID and limit to 6 events
      const uniqueEvents = upcomingEvents.filter((event, index, self) => 
        index === self.findIndex(e => e.id === event.id)
      ).slice(0, 6);
      
      return uniqueEvents;
    },
    {
      ttl: 2 * 60 * 1000, // Cache for 2 minutes
      enabled: true
    }
  );

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

  // Memoize expensive calculations
  const categories = useMemo(() => 
    ["All Events", ...new Set((events || []).map(event => event.category).filter(Boolean))],
    [events]
  );

  const filteredEvents = useMemo(() => 
    selectedCategory === "All Events" 
      ? (events || [])
      : (events || []).filter(event => event.category === selectedCategory),
    [events, selectedCategory]
  );

  // Debounced category selection to prevent excessive re-renders
  const debouncedCategorySelect = useMemo(
    () => performanceUtils.debounce((category: string) => {
      setSelectedCategory(category);
    }, 150),
    []
  );

  return (
    <>
      <SEOHead 
        title="MyEcclesia – Book Christian Events & Tickets"
        description="Discover, book, and attend top Christian events with MyEcclesia—your go-to platform for church gatherings, conferences, and community activities."
        keywords="MyEcclesia, Christian events, church tickets, event platform, UK Christian community"
        canonicalUrl="https://myecclesia.com/"
      />
      <div className="min-h-screen bg-background">
        <SEOOptimizations />
        <StructuredData data={createOrganizationSchema()} />
        <Header />
        <Hero />
        
        {/* Events Section */}
        <section id="events" className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Upcoming Events
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join us for these upcoming events and be part of our growing community of faith.
              </p>
            </div>
            
            {/* Event Categories Filter */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {categories.map((category) => (
                <Badge 
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"} 
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                  onClick={() => debouncedCategorySelect(category)}
                >
                  {category}
                </Badge>
              ))}
            </div>
            
            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <LoadingEventCard key={index} />
                ))
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id} 
                    {...event} 
                    availableTickets={0}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground text-lg">
                    {selectedCategory === "All Events" 
                      ? "No upcoming events found." 
                      : `No upcoming events found in ${selectedCategory}.`}
                  </p>
                </div>
              )}
            </div>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/events")}
              >
                View All Events
              </Button>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-muted">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Join Our Events?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Experience the warmth of our community and grow in your faith journey.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Easy Registration</h3>
                <p className="text-muted-foreground">Simple, secure registration process for all events</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Community</h3>
                <p className="text-muted-foreground">Connect with fellow believers and build lasting friendships</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                  <Heart className="h-8 w-8 text-success" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Spiritual Growth</h3>
                <p className="text-muted-foreground">Deepen your faith through meaningful experiences</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Star className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Quality Events</h3>
                <p className="text-muted-foreground">Thoughtfully planned events for all ages and interests</p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Newsletter Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="max-w-md mx-auto">
              <NewsletterSignup />
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
};

export default Index;