import { useState, useEffect } from "react";
import { MapPin, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface EventCardProps {
  id: string;
  slug?: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  image: string;
  price: number;
  availableTickets?: number;
  category?: string;
  denominations?: string;
  organizer?: string;
}

const EventCard = ({ 
  id,
  slug,
  title, 
  date, 
  time, 
  location, 
  image, 
  price, 
  category,
  organizer 
}: EventCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);

  // Check if event is saved
  useEffect(() => {
    if (!user) {
      setIsSaved(false);
      return;
    }

    const checkSavedStatus = async () => {
      const { data } = await supabase
        .from("saved_events")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", id)
        .maybeSingle();
      
      setIsSaved(!!data);
    };

    checkSavedStatus();
  }, [user, id]);

  const handleViewEvent = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('eventsScrollPosition', window.scrollY.toString());
      const currentPage = sessionStorage.getItem('eventsCurrentPage') || '1';
      sessionStorage.setItem('eventsCurrentPage', currentPage);
    }
    navigate(`/events/${slug || id}`);
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save events.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setSavingState(true);
    
    try {
      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", id);
        
        if (error) throw error;
        
        setIsSaved(false);
        toast({
          title: "Event removed",
          description: "Event removed from your saved list.",
        });
      } else {
        // Add to saved
        const { error } = await supabase
          .from("saved_events")
          .insert({ user_id: user.id, event_id: id });
        
        if (error) throw error;
        
        setIsSaved(true);
        toast({
          title: "Event saved!",
          description: "You can view your saved events in your dashboard.",
        });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({
        title: "Error",
        description: "Failed to save event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSavingState(false);
    }
  };

  // Format date like "SAT, DEC 14"
  const formatDateEventbrite = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    const day = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const month = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const dayNum = dateObj.getDate();
    return { day, month, dayNum };
  };

  // Format time like "5:00 PM"
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isSalesEnded = () => {
    const eventDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return eventDateTime <= now;
  };

  const { day, month, dayNum } = formatDateEventbrite(date);

  return (
    <Card 
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 border border-border/50 bg-card cursor-pointer rounded-xl" 
      onClick={handleViewEvent}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Price Badge */}
        <div className="absolute bottom-3 left-3">
          {price === 0 ? (
            <Badge className="bg-emerald-500 text-white font-semibold px-3 py-1 shadow-lg">
              Free
            </Badge>
          ) : (
            <Badge className="bg-white text-foreground font-semibold px-3 py-1 shadow-lg">
              From £{price}
            </Badge>
          )}
        </div>

        {/* Save Button */}
        <button 
          className={`absolute top-3 right-3 p-2 rounded-full shadow-md transition-all ${
            isSaved 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-white/90 backdrop-blur-sm hover:bg-white'
          } ${savingState ? 'opacity-50' : ''}`}
          onClick={handleSaveToggle}
          disabled={savingState}
          aria-label={isSaved ? "Remove from saved" : "Save event"}
        >
          <Heart 
            className={`h-4 w-4 transition-colors ${
              isSaved 
                ? 'text-white fill-white' 
                : 'text-muted-foreground hover:text-red-500'
            }`} 
          />
        </button>

        {/* Category Badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground text-xs font-medium">
              {category}
            </Badge>
          </div>
        )}

        {/* Sold Out Overlay */}
        {isSalesEnded() && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-muted text-muted-foreground text-sm font-semibold px-4 py-2">
              Sales Ended
            </Badge>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Date & Time - Eventbrite Style */}
        <div className="text-primary font-semibold text-sm mb-2">
          {day}, {month} {dayNum} · {formatTime(time)}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {title}
        </h3>
        
        {/* Location */}
        <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-3">
          <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
          <span className="line-clamp-1">{location}</span>
        </div>

        {/* Organizer */}
        {organizer && (
          <div className="flex items-center gap-2 pt-3 border-t border-border/50">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {organizer.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-muted-foreground line-clamp-1">
              {organizer}
            </span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default EventCard;
