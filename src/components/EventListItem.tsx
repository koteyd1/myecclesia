import { useState, useEffect } from "react";
import { MapPin, Heart, Calendar, ExternalLink, Ticket, Building2, User, Clock, Share2 } from "lucide-react";
import { SocialShare } from "@/components/SocialShare";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface EventListItemProps {
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
  ticket_url?: string | null;
  external_url?: string | null;
  organization_id?: string | null;
  minister_id?: string | null;
  organizations?: { slug: string; name: string } | null;
  ministers?: { slug: string; full_name: string } | null;
}

const EventListItem = ({ 
  id,
  slug,
  title, 
  date, 
  time, 
  location, 
  description,
  image, 
  price, 
  category,
  organizer,
  ticket_url,
  external_url,
  organizations,
  ministers,
}: EventListItemProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSaved, setIsSaved] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [imageError, setImageError] = useState(false);

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
        const { error } = await supabase
          .from("saved_events")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", id);
        
        if (error) throw error;
        setIsSaved(false);
        toast({ title: "Event removed", description: "Event removed from your saved list." });
      } else {
        const { error } = await supabase
          .from("saved_events")
          .insert({ user_id: user.id, event_id: id });
        
        if (error) throw error;
        setIsSaved(true);
        toast({ title: "Event saved!", description: "You can view your saved events in your dashboard." });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      toast({ title: "Error", description: "Failed to save event. Please try again.", variant: "destructive" });
    } finally {
      setSavingState(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    return dateObj.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isSalesEnded = () => {
    const eventDateTime = new Date(`${date}T${time}`);
    return eventDateTime <= new Date();
  };

  const isExternalEvent = !!(ticket_url || external_url);

  return (
    <div 
      className="group flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4 bg-card border border-border/50 rounded-xl hover:shadow-lg hover:border-primary/20 transition-all duration-200 cursor-pointer"
      onClick={handleViewEvent}
    >
      {/* Mobile: Top row with image and basic info */}
      <div className="flex gap-3 sm:hidden">
        {/* Image - smaller on mobile */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {image && !imageError ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="h-6 w-6 text-muted-foreground/50" />
            </div>
          )}
          {isSalesEnded() && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-muted text-muted-foreground text-[10px]">Ended</Badge>
            </div>
          )}
        </div>

        {/* Mobile content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm leading-tight mb-1">
            {title}
          </h3>
          <p className="text-xs text-primary font-medium mb-1">
            {formatDate(date)} · {formatTime(time)}
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </div>

      {/* Mobile: Bottom row with badges, price, and actions */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          {category && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {category}
            </Badge>
          )}
          {isExternalEvent ? (
            <Badge className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
              <ExternalLink className="h-2.5 w-2.5" />
              External
            </Badge>
          ) : (
            <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
              <Ticket className="h-2.5 w-2.5" />
              Book Here
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {price === 0 ? (
            <Badge className="bg-emerald-500 text-white font-semibold text-xs">Free</Badge>
          ) : (
            <span className="font-semibold text-foreground text-sm">£{price}</span>
          )}
          <button 
            className={`p-1.5 rounded-full transition-all ${
              isSaved 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-muted hover:bg-muted/80'
            } ${savingState ? 'opacity-50' : ''}`}
            onClick={handleSaveToggle}
            disabled={savingState}
            aria-label={isSaved ? "Remove from saved" : "Save event"}
          >
            <Heart 
              className={`h-3.5 w-3.5 transition-colors ${
                isSaved ? 'text-white fill-white' : 'text-muted-foreground hover:text-red-500'
              }`} 
            />
          </button>
        </div>
      </div>

      {/* Desktop layout - hidden on mobile */}
      <div className="hidden sm:flex gap-4 w-full">
        {/* Image */}
        <div className="relative w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
          {image && !imageError ? (
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <Calendar className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
          
          {isSalesEnded() && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge className="bg-muted text-muted-foreground text-xs">Ended</Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Date & Category Row */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-primary font-medium text-sm">
                {formatDate(date)} · {formatTime(time)}
              </span>
              {category && (
                <Badge variant="secondary" className="text-xs">
                  {category}
                </Badge>
              )}
              {isExternalEvent ? (
                <Badge className="bg-amber-500/10 text-amber-600 text-xs flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  External
                </Badge>
              ) : (
                <Badge className="bg-emerald-500/10 text-emerald-600 text-xs flex items-center gap-1">
                  <Ticket className="h-3 w-3" />
                  Book Here
                </Badge>
              )}
            </div>

            {/* Title */}
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
              {title}
            </h3>

            {/* Description */}
            {description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                {description}
              </p>
            )}

            {/* Location & Organizer */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{location}</span>
              </div>
              {(organizer || organizations || ministers) && (
                <div className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">
                    {organizations?.name || ministers?.full_name || organizer}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Price & Actions */}
        <div className="flex flex-col items-end justify-between flex-shrink-0">
          {/* Price */}
          <div className="text-right">
            {price === 0 ? (
              <Badge className="bg-emerald-500 text-white font-semibold">Free</Badge>
            ) : (
              <span className="font-semibold text-foreground">From £{price}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <SocialShare
              url={`/events/${slug || id}`}
              title={title}
              description={`${formatDate(date)} at ${location}`}
              className="p-2 h-auto bg-muted hover:bg-muted/80 border-0"
            />
            <button 
              className={`p-2 rounded-full transition-all ${
                isSaved 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-muted hover:bg-muted/80'
              } ${savingState ? 'opacity-50' : ''}`}
              onClick={handleSaveToggle}
              disabled={savingState}
              aria-label={isSaved ? "Remove from saved" : "Save event"}
            >
              <Heart 
                className={`h-4 w-4 transition-colors ${
                  isSaved ? 'text-white fill-white' : 'text-muted-foreground hover:text-red-500'
                }`} 
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventListItem;
