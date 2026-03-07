import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Eye, Calendar, MapPin, Clock, CheckCheck } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { useNavigate } from "react-router-dom";

export const AdminPendingEvents = () => {
  const [pendingEvents, setPendingEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifyingAll, setIsVerifyingAll] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingEvents();
  }, []);

  const fetchPendingEvents = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPendingEvents(data || []);
      setFilteredEvents(data || []);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load pending events.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredEvents(pendingEvents);
    } else {
      const filtered = pendingEvents.filter(event =>
        event.title.toLowerCase().includes(query.toLowerCase()) ||
        event.description?.toLowerCase().includes(query.toLowerCase()) ||
        event.location.toLowerCase().includes(query.toLowerCase()) ||
        event.organizer?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredEvents(filtered);
    }
  };

  const handleVerify = async (eventId: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ is_verified: true })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Event Verified!",
        description: "This event is now publicly visible.",
      });
      fetchPendingEvents();
    } catch (error) {
      console.error("Error verifying event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify event.",
      });
    }
  };

  const handleVerifyAll = async () => {
    if (pendingEvents.length === 0) return;
    
    if (!confirm(`Are you sure you want to verify all ${pendingEvents.length} pending events?`)) {
      return;
    }

    setIsVerifyingAll(true);
    try {
      const eventIds = pendingEvents.map(event => event.id);
      const { error } = await supabase
        .from("events")
        .update({ is_verified: true })
        .in("id", eventIds);

      if (error) throw error;

      toast({
        title: "All Events Verified!",
        description: `${pendingEvents.length} events are now publicly visible.`,
      });
      fetchPendingEvents();
    } catch (error) {
      console.error("Error verifying all events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to verify all events.",
      });
    } finally {
      setIsVerifyingAll(false);
    }
  };

  const handleViewEvent = (slug: string) => {
    navigate(`/events/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Pending Events</h2>
          <p className="text-muted-foreground">
            {pendingEvents.length} event{pendingEvents.length !== 1 ? 's' : ''} awaiting verification
          </p>
        </div>
        {pendingEvents.length > 0 && (
          <Button 
            onClick={handleVerifyAll} 
            disabled={isVerifyingAll}
            variant="default"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            {isVerifyingAll ? "Verifying..." : "Verify All"}
          </Button>
        )}
      </div>

      <SearchBar
        onSearch={handleSearch}
        placeholder="Search pending events..."
        className="max-w-md"
      />

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShieldCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Pending Events</h3>
            <p className="text-muted-foreground text-center">
              All events have been reviewed. New submissions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="border-warning bg-warning/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <CardDescription className="mt-1">{event.organizer || 'Unknown organizer'}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-warning-foreground border-warning shrink-0">
                    Pending
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-32 object-cover rounded-md"
                  />
                )}
                
                <div className="flex gap-2 flex-wrap">
                  {event.category && <Badge>{event.category}</Badge>}
                  {event.denominations && <Badge variant="outline">{event.denominations}</Badge>}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2">
                  {event.description?.replace(/<[^>]*>/g, '') || 'No description provided'}
                </p>

                <div className="text-sm space-y-1">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                </div>

                <p className="text-sm">
                  <strong>Price:</strong> {event.price > 0 ? `£${event.price}` : 'Free'}
                </p>

                <p className="text-xs text-muted-foreground">
                  Submitted: {new Date(event.created_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleVerify(event.id)}
                    className="flex-1"
                  >
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    Verify
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewEvent(event.slug)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
