import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Heart, Star, ArrowRight, BookOpen } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
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
import { useSiteTracking } from "@/hooks/useSiteTracking";

// Blog Preview Card Component for better internal linking
const BlogPreviewCard = ({ slug, title, excerpt, category, author, readTime }: {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  readTime: string;
}) => (
  <Link to={`/blog/${slug}`} className="group block">
    <div className="bg-card border rounded-lg p-6 h-full hover:shadow-md transition-all duration-300 hover:border-primary/20">
      <div className="flex items-center justify-between mb-3">
        <Badge variant="secondary" className="text-xs">{category}</Badge>
        <span className="text-xs text-muted-foreground">{readTime}</span>
      </div>
      <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
        {excerpt}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">By {author}</span>
        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  </Link>
);

// Featured Blog Section Component that fetches admin-created blogs
const FeaturedBlogSection = () => {
  const navigate = useNavigate();
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        // Fetch the latest 3 published blog posts (no admin restriction for homepage)
        const { data, error } = await supabase
          .from("blog_posts")
          .select("*")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) throw error;
        setFeaturedBlogs(data || []);
      } catch (error) {
        console.error("Error fetching featured blogs:", error);
        setFeaturedBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedBlogs();
  }, []);

  if (loading) {
    return (
      <div className="mt-16 pt-16 border-t">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-semibold text-foreground mb-4">Latest from Our Blog</h2>
          <p className="text-muted-foreground">Loading latest articles...</p>
        </div>
      </div>
    );
  }

  if (featuredBlogs.length === 0) {
    return null; // Don't show the section if no admin blogs exist
  }

  return (
    <div className="mt-16 pt-16 border-t">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-semibold text-foreground mb-4">Latest from Our Blog</h2>
        <p className="text-muted-foreground">Inspiring stories and insights from our community</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {featuredBlogs.map((post) => (
          <BlogPreviewCard 
            key={post.id}
            slug={post.slug}
            title={post.title}
            excerpt={post.excerpt || post.content?.substring(0, 160) || ""}
            category={post.category || "Blog"}
            author={post.author}
            readTime={`${Math.ceil((post.content?.length || 0) / 200)} min read`}
          />
        ))}
      </div>
      <div className="text-center">
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate("/blog")}
        >
          Read More Articles
        </Button>
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  useSiteTracking("Home - myEcclesia");
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("All Events");

  // Use cached events data
  const { data: events = [], loading, error } = useCache(
    'homepage-events',
    async () => {
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, date, time, location, description, image, price, category, denominations, organizer")
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(20); // Increased limit to get more variety

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
      
      // Enhanced deduplication: remove duplicates based on normalized title, date, time, and location
      const seenEvents = new Set();
      const uniqueEvents = upcomingEvents.filter((event) => {
        // Create a unique key based on normalized title, date, time, and location
        const normalizedTitle = event.title
          .toLowerCase()
          .replace(/\s*-\s*\d+$/, '') // Remove trailing " - 1", " - 2", etc.
          .replace(/\s+/g, ' ')
          .trim();
        
        const eventKey = `${normalizedTitle}|${event.date}|${event.time}|${event.location}`;
        
        if (seenEvents.has(eventKey)) {
          return false; // Skip duplicate
        }
        
        seenEvents.add(eventKey);
        return true;
      }).slice(0, 6); // Limit to 6 unique events
      
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
            <div className="flex flex-wrap justify-center gap-2 mb-6 sm:mb-8 px-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
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
            
            {/* Featured Blog Posts Section */}
            <FeaturedBlogSection />
            
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
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
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
      </div>
    </>
  );
};

export default Index;