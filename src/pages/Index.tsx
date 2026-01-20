import Hero from "@/components/Hero";
import FeaturedEventsCarousel from "@/components/FeaturedEventsCarousel";
import EventCard from "@/components/EventCard";
import CategoryBrowser from "@/components/CategoryBrowser";
import PopularNearYou from "@/components/PopularNearYou";
import LocationBrowser from "@/components/LocationBrowser";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Heart, Star, ArrowRight, BookOpen, TrendingUp } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
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
import { useAuth } from "@/hooks/useAuth";

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

  if (loading || featuredBlogs.length === 0) {
    return null;
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
  const { user } = useAuth();
  useSiteTracking("Home - myEcclesia");
  const { toast } = useToast();

  // Check for email confirmation and show success toast
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    
    // Check for successful email confirmation indicators
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type') || urlParams.get('type');
    const confirmationSuccess = urlParams.get('confirmed');
    
    // If user just confirmed their email (has access_token with signup type, or confirmed param)
    if ((accessToken && type === 'signup') || confirmationSuccess === 'true') {
      toast({
        title: "🎉 Email Confirmed!",
        description: "Welcome to MyEcclesia! Your account is now active and you can start exploring events.",
        duration: 6000,
      });
      
      // Clean up URL parameters
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [toast]);

  // Use cached events data
  const { data: events = [], loading, error } = useCache(
    'homepage-events-v4',
    async () => {
      const dateStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().slice(0, 8);
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, date, time, location, description, image, price, category, denominations, organizer")
        .or(`date.gt.${dateStr},and(date.eq.${dateStr},time.gte.${timeStr})`)
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(60);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return [];
      }
      
      // Enhanced deduplication
      const seenEvents = new Set();
      const uniqueEvents = data.filter((event) => {
        const normalizedTitle = event.title
          .toLowerCase()
          .replace(/\s*-\s*\d+$/, '')
          .replace(/\s+/g, ' ')
          .trim();
        
        const eventKey = `${normalizedTitle}|${event.date}|${event.time}|${event.location}`;
        
        if (seenEvents.has(eventKey)) {
          return false;
        }
        
        seenEvents.add(eventKey);
        return true;
      }).slice(0, 8);
      
      return uniqueEvents;
    },
    {
      ttl: 2 * 60 * 1000,
      enabled: true
    }
  );

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

  // Fetch category counts from all upcoming events
  const { data: categoryEventCounts = {} } = useCache(
    'category-event-counts-v1',
    async () => {
      const dateStr = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("events")
        .select("category")
        .gte("date", dateStr)
        .not("category", "is", null);

      if (error) throw error;
      
      const counts: Record<string, number> = {};
      (data || []).forEach(event => {
        if (event.category) {
          counts[event.category] = (counts[event.category] || 0) + 1;
        }
      });
      return counts;
    },
    { ttl: 5 * 60 * 1000, enabled: true }
  );

  return (
    <>
      <SEOHead 
        title="MyEcclesia – Book Christian Events & Tickets"
        description="Discover, book, and attend top Christian events with MyEcclesia—your go-to platform for church gatherings, conferences, and community activities."
        keywords="MyEcclesia, Christian events, church tickets, event platform, UK Christian community"
        canonicalUrl="https://myecclesia.org.uk/"
      />
      <div className="min-h-screen bg-background">
        <SEOOptimizations />
        <StructuredData data={createOrganizationSchema()} />
        <Hero />
        
        {/* Featured Events Carousel */}
        <FeaturedEventsCarousel />
        
        {/* Browse by Category */}
        <CategoryBrowser eventCounts={categoryEventCounts} />
        
        {/* Popular in Your Area */}
        <PopularNearYou />
        
        {/* Browse by Location */}
        <LocationBrowser />
        
        {/* Trending/Upcoming Events Section */}
        <section id="events" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium text-primary uppercase tracking-wide">Happening Soon</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  Upcoming Events
                </h2>
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate("/events")}
                className="hidden sm:flex"
              >
                See all events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Events Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
              {loading ? (
                Array.from({ length: 8 }).map((_, index) => (
                  <LoadingEventCard key={index} />
                ))
              ) : events && events.length > 0 ? (
                events.map((event) => (
                  <EventCard 
                    key={event.id} 
                    {...event} 
                    availableTickets={0}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    No upcoming events found.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/events")}
                  >
                    Browse All Events
                  </Button>
                </div>
              )}
            </div>
            
            {/* Mobile View All Button */}
            <div className="text-center sm:hidden">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate("/events")}
                className="w-full"
              >
                See all events
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            
            {/* Featured Blog Posts Section */}
            <FeaturedBlogSection />
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                Why Join Our Events?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Experience the warmth of our community and grow in your faith journey.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Calendar className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Easy Registration</h3>
                <p className="text-sm text-muted-foreground">Simple, secure registration process for all events</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Community</h3>
                <p className="text-sm text-muted-foreground">Connect with fellow believers and build lasting friendships</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Heart className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Spiritual Growth</h3>
                <p className="text-sm text-muted-foreground">Deepen your faith through meaningful experiences</p>
              </div>
              
              <div className="text-center group">
                <div className="bg-primary/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                  <Star className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Quality Events</h3>
                <p className="text-sm text-muted-foreground">Thoughtfully planned events for all ages and interests</p>
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