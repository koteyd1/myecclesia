import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface EventRegistration {
  id: string;
  event_id: string;
  registered_at: string;
  status: string;
  events: {
    id: string;
    title: string;
    description: string;
    date: string;
    time: string;
    location: string;
    image: string;
    category: string;
    organizer: string;
  };
}

const Dashboard = () => {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRegistrations();
    }
  }, [user]);

  const fetchUserRegistrations = async () => {
    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select(`
          id,
          event_id,
          registered_at,
          status,
          events (
            id,
            title,
            description,
            date,
            time,
            location,
            image,
            category,
            organizer
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "registered")
        .order("registered_at", { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        title: "Error",
        description: "Failed to load your event registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelRegistration = async (registrationId: string) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: "cancelled" })
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Registration Cancelled",
        description: "You have successfully cancelled your event registration",
      });

      fetchUserRegistrations();
    } catch (error) {
      console.error("Error cancelling registration:", error);
      toast({
        title: "Error",
        description: "Failed to cancel registration",
        variant: "destructive",
      });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <p>You need to be signed in to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your event registrations</p>
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            My Registered Events ({registrations.length})
          </h2>
        </div>

        {registrations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Registered</h3>
              <p className="text-muted-foreground mb-4">
                You haven't registered for any events yet.
              </p>
              <Button onClick={() => window.location.href = "/events"}>
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {registrations.map((registration) => (
              <Card key={registration.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  {registration.events.image && (
                    <div className="md:w-48 h-48 md:h-auto">
                      <img
                        src={registration.events.image}
                        alt={registration.events.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl mb-2">
                            {registration.events.title}
                          </CardTitle>
                          {registration.events.category && (
                            <Badge variant="secondary" className="mb-2">
                              {registration.events.category}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelRegistration(registration.id)}
                        >
                          Cancel Registration
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {registration.events.description}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span>{format(new Date(registration.events.date), "MMM dd, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <span>{registration.events.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span>{registration.events.location}</span>
                        </div>
                      </div>

                      {registration.events.organizer && (
                        <div className="mt-4 text-sm text-muted-foreground">
                          Organized by {registration.events.organizer}
                        </div>
                      )}

                      <div className="mt-4 text-xs text-muted-foreground">
                        Registered on {format(new Date(registration.registered_at), "MMM dd, yyyy 'at' h:mm a")}
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;