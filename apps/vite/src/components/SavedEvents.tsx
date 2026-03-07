import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, Calendar, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SavedEvent {
  id: string;
  event_id: string;
  created_at: string;
  events: {
    id: string;
    slug: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
    price: number;
    category: string;
  };
}

const SavedEvents = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedEvents, setSavedEvents] = useState<SavedEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchSavedEvents();
  }, [user]);

  const fetchSavedEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("saved_events")
        .select(`
          id,
          event_id,
          created_at,
          events (
            id,
            slug,
            title,
            date,
            time,
            location,
            image,
            price,
            category
          )
        `)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedEvents((data as SavedEvent[]) || []);
    } catch (error) {
      console.error("Error fetching saved events:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (savedEventId: string) => {
    try {
      const { error } = await supabase
        .from("saved_events")
        .delete()
        .eq("id", savedEventId);

      if (error) throw error;

      setSavedEvents(prev => prev.filter(e => e.id !== savedEventId));
      toast({
        title: "Event removed",
        description: "Event removed from your saved list.",
      });
    } catch (error) {
      console.error("Error removing saved event:", error);
      toast({
        title: "Error",
        description: "Failed to remove event.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isUpcoming = (dateStr: string, timeStr: string) => {
    const eventDateTime = new Date(`${dateStr}T${timeStr}`);
    return eventDateTime > new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Saved Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500 fill-red-500" />
          Saved Events
        </CardTitle>
        <CardDescription>
          Events you've bookmarked for later
        </CardDescription>
      </CardHeader>
      <CardContent>
        {savedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              No saved events yet
            </p>
            <Button variant="outline" onClick={() => navigate("/events")}>
              Browse Events
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedEvents.map((saved) => {
              const event = saved.events;
              if (!event) return null;
              
              const upcoming = isUpcoming(event.date, event.time);
              
              return (
                <div 
                  key={saved.id}
                  className={`flex gap-4 p-3 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${
                    !upcoming ? 'opacity-60' : ''
                  }`}
                  onClick={() => navigate(`/events/${event.slug || event.id}`)}
                >
                  {/* Event Image */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0">
                    <img 
                      src={event.image} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors">
                          {event.title}
                        </h4>
                        <p className="text-sm text-primary font-medium mt-1">
                          {formatDate(event.date)} · {formatTime(event.time)}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          <span className="line-clamp-1">{event.location}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {!upcoming && (
                          <Badge variant="secondary" className="text-xs">
                            Past
                          </Badge>
                        )}
                        {event.price === 0 ? (
                          <Badge className="bg-emerald-500 text-white text-xs">
                            Free
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            £{event.price}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/events/${event.slug || event.id}`);
                        }}
                      >
                        View Event
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemove(saved.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {savedEvents.length > 0 && (
              <div className="text-center pt-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => navigate("/events")}
                >
                  Browse more events
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SavedEvents;
