import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, Ticket, User, Settings, BarChart3, CalendarIcon, Heart, Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventAnalytics } from "@/components/EventAnalytics";
import SavedEvents from "@/components/SavedEvents";
import { EventRecommendations } from "@/components/EventRecommendations";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { SEOHead } from "@/components/SEOHead";

interface EventRegistration {
  id: string;
  event_id: string;
  registered_at: string;
  status: string;
  quantity?: number;
  payment_status?: string;
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
      external_url: string;
    };
}

const Dashboard = () => {
  const navigate = useNavigate();
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
          quantity,
          payment_status,
          events (
            id,
            title,
            description,
            date,
            time,
            location,
            image,
            category,
            organizer,
            external_url
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
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
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
      <SEOHead
        title="My Dashboard | MyEcclesia"
        description="Manage your event registrations, saved events, and notification preferences. Access your personalized MyEcclesia dashboard."
        noIndex={true}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">My Dashboard</h1>
          <p className="text-muted-foreground">Manage your event registrations</p>
        </div>

        {/* Quick Links */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Link to="/my-profiles">
                <Button variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  My Profiles
                </Button>
              </Link>
              <Link to="/profile/edit">
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/events")}
              >
                Browse Events
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/event-guidelines")}
              >
                Event Guidelines & Safety
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/calendar")}
              >
                Event Calendar
              </Button>
              <Button
                variant="outline" 
                size="sm"
                onClick={() => navigate("/contact")}
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              Saved
            </TabsTrigger>
            <TabsTrigger value="for-you">For You</TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
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
                    <div 
                      className="md:w-48 h-48 md:h-auto cursor-pointer"
                      onClick={() => navigate(`/events/${registration.events.id}`)}
                    >
                      <img
                        src={registration.events.image}
                        alt={registration.events.title}
                        className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                        loading="lazy"
                        decoding="async"
                        style={{
                          imageRendering: 'auto',
                          WebkitBackfaceVisibility: 'hidden',
                          backfaceVisibility: 'hidden'
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div 
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => navigate(`/events/${registration.events.id}`)}
                        >
                          <CardTitle className="text-xl mb-2">
                            {registration.events.title}
                          </CardTitle>
                          {registration.events.category && (
                            <Badge variant="secondary" className="mb-2">
                              {registration.events.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => cancelRegistration(registration.id)}
                          >
                            Cancel Registration
                          </Button>
                          {registration.events.external_url && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => window.open(registration.events.external_url, '_blank')}
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              Collect Ticket
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent 
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => navigate(`/events/${registration.events.id}`)}
                    >
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
          </TabsContent>

          <TabsContent value="saved">
            <SavedEvents />
          </TabsContent>

          <TabsContent value="for-you">
            <EventRecommendations />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationPreferences />
          </TabsContent>

          <TabsContent value="analytics">
            <EventAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;