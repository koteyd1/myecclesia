import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowLeft, Mail, Phone, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    fullName: user?.user_metadata?.full_name || "",
    email: user?.email || "",
    phone: ""
  });

  // Mock event data - this will come from Supabase later
  const event = {
    id: id,
    title: "Sunday Worship Service",
    date: "2024-01-21",
    time: "10:00 AM",
    location: "Main Sanctuary",
    description: "Join us for our weekly worship service with inspiring music and meaningful messages. This service includes contemporary worship, prayer time, and an inspiring message from our pastor. All are welcome to join us in fellowship and worship as we come together as a community of faith.",
    image: "/placeholder.svg",
    price: 0,
    availableTickets: 200,
    category: "Worship",
    organizer: "Pastor John Smith",
    duration: "1.5 hours",
    requirements: "None - All ages welcome"
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      // TODO: Implement actual registration logic with Supabase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Registration Successful!",
        description: `You've been registered for ${event.title}. A confirmation email will be sent shortly.`,
      });
      
      navigate("/events");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: "There was an error registering for this event. Please try again.",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegistrationData({
      ...registrationData,
      [e.target.name]: e.target.value
    });
  };

  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Button onClick={() => navigate("/events")}>Back to Events</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/events")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <div className="relative mb-8">
              <img 
                src={event.image} 
                alt={event.title}
                className="w-full h-64 md:h-80 object-cover rounded-lg"
              />
              <div className="absolute top-4 left-4">
                <Badge variant="secondary" className="bg-white/90 text-foreground">
                  {event.category}
                </Badge>
              </div>
              {event.price === 0 ? (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-success text-success-foreground">
                    Free
                  </Badge>
                </div>
              ) : (
                <div className="absolute top-4 right-4">
                  <Badge variant="outline" className="bg-white/90 text-foreground">
                    ${event.price}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-4">{event.title}</h1>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {event.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-5 w-5 mr-3 text-primary" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-5 w-5 mr-3 text-primary" />
                  <span>{event.time} ({event.duration})</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <MapPin className="h-5 w-5 mr-3 text-primary" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Users className="h-5 w-5 mr-3 text-primary" />
                  <span>{event.availableTickets} spots available</span>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Event Details</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p><strong>Organizer:</strong> {event.organizer}</p>
                  <p><strong>Requirements:</strong> {event.requirements}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle>Register for Event</CardTitle>
                <CardDescription>
                  {event.price === 0 ? "This event is free to attend" : `Registration fee: $${event.price}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegistration} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={registrationData.fullName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={registrationData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={registrationData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                    disabled={isRegistering}
                  >
                    {isRegistering ? "Registering..." : "Complete Registration"}
                  </Button>
                </form>

                <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
                  <p>
                    By registering, you agree to receive event updates and confirmations via email.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventDetail;