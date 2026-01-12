import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedEvent {
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
  organizer: string;
}

const FeaturedEventsCarousel = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<FeaturedEvent[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const dateStr = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
          .from("events")
          .select("id, slug, title, date, time, location, description, image, price, category, organizer")
          .eq("is_featured", true)
          .eq("approval_status", "approved")
          .gte("date", dateStr)
          .order("date", { ascending: true })
          .limit(5);

        if (error) throw error;
        setEvents(data || []);
      } catch (error) {
        console.error("Error fetching featured events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (events.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % events.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [events.length]);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
  }, [events.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % events.length);
  }, [events.length]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayNum = date.getDate();
    return `${day}, ${month} ${dayNum}`;
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Don't render if no featured events
  if (!loading && events.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <div className="relative h-[400px] sm:h-[450px] bg-muted animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <section className="relative h-[400px] sm:h-[450px] overflow-hidden bg-black">
      {/* Background Images */}
      {events.map((event, index) => (
        <div
          key={event.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
        <div className="max-w-2xl">
          {/* Featured Badge */}
          <div className="flex items-center gap-2 mb-4">
            <Badge className="bg-primary text-primary-foreground px-3 py-1">
              <Star className="h-3 w-3 mr-1 fill-current" />
              Featured
            </Badge>
            {currentEvent.category && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {currentEvent.category}
              </Badge>
            )}
          </div>

          {/* Date */}
          <p className="text-primary font-semibold text-sm sm:text-base mb-2">
            {formatDate(currentEvent.date)} · {formatTime(currentEvent.time)}
          </p>

          {/* Title */}
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 line-clamp-2">
            {currentEvent.title}
          </h2>

          {/* Description */}
          {currentEvent.description && (
            <p className="text-white/80 text-sm sm:text-base mb-4 line-clamp-2 max-w-lg">
              {currentEvent.description}
            </p>
          )}

          {/* Location */}
          <div className="flex items-center gap-2 text-white/70 text-sm mb-6">
            <MapPin className="h-4 w-4" />
            <span>{currentEvent.location}</span>
          </div>

          {/* Price & CTA */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={() => navigate(`/events/${currentEvent.slug || currentEvent.id}`)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {currentEvent.price === 0 ? 'Register Free' : `From £${currentEvent.price}`}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate(`/events/${currentEvent.slug || currentEvent.id}`)}
              className="border-white/30 text-white hover:bg-white/10 bg-transparent"
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {events.length > 1 && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            aria-label="Previous event"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
            aria-label="Next event"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {events.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {events.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedEventsCarousel;
