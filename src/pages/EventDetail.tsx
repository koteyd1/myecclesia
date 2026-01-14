import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users, ArrowLeft, CheckCircle, CalendarPlus, CalendarMinus, CreditCard, Ticket } from "lucide-react";
import { TicketPurchase } from "@/components/TicketPurchase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData, createEventSchema } from "@/components/StructuredData";
import { useEventTracking } from "@/hooks/useEventTracking";

const EventDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [isInCalendar, setIsInCalendar] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  
  // Track event views
  useEventTracking(event?.id);

  const [verifyingPayment, setVerifyingPayment] = useState(false);

  // Handle payment success/cancel - verify payment and create ticket
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId && user && !verifyingPayment) {
      setVerifyingPayment(true);
      
      // Verify payment and create ticket
      supabase.functions.invoke("verify-ticket-payment", {
        body: { sessionId },
      }).then(({ data, error }) => {
        if (error) {
          console.error("Error verifying payment:", error);
          toast({
            title: "Payment Verification Issue",
            description: "Your payment was successful but we couldn't verify it immediately. Please check My Tickets.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ticket Confirmed! 🎉",
            description: "Your ticket has been created. View it in My Tickets.",
          });
          checkRegistrationStatus();
        }
        // Clear URL params
        navigate(`/events/${slug}`, { replace: true });
      }).finally(() => {
        setVerifyingPayment(false);
      });
    } else if (paymentStatus === 'canceled') {
      toast({
        title: "Payment Cancelled",
        description: "Your payment was cancelled. You can try again when you're ready.",
        variant: "destructive",
      });
      navigate(`/events/${slug}`, { replace: true });
    }
  }, [searchParams, user, slug]);

  useEffect(() => {
    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  useEffect(() => {
    if (event && user) {
      checkRegistrationStatus();
      checkCalendarStatus();
    }
  }, [event, user]);

  const fetchEvent = async () => {
    if (!slug) return;

    const isUuid = (value: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

    try {
      // Primary lookup: by slug
      let { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;

      // Fallback lookup: if someone navigated using the event UUID
      if (!data && isUuid(slug)) {
        const byId = await supabase
          .from("events")
          .select("*")
          .eq("id", slug)
          .maybeSingle();

        if (byId.error) throw byId.error;
        data = byId.data;
      }

      if (data) {
        setEvent(data);

        // Canonicalize the URL to the slug route (helps SEO + avoids "not found" when linked by id)
        if (data.slug && data.slug !== slug) {
          navigate(`/events/${data.slug}`, { replace: true });
        }
      } else {
        console.log("No event found for identifier:", slug);
      }
    } catch (error) {
      console.error("Error fetching event:", error);
      
      // Fallback data for SSR and when event is not found
      const fallbackEvents = {
        'christmas-carol-service-2024': {
          id: 'fallback-1',
          slug: 'christmas-carol-service-2024',
          title: 'Christmas Carol Service 2024',
          description: 'Join us for a beautiful Christmas Carol Service filled with traditional hymns, readings, and community fellowship. This special service brings together our church family to celebrate the birth of Jesus Christ.',
          date: '2024-12-24',
          time: '18:00',
          duration: '2 hours',
          location: 'St. Mary\'s Church, London',
          category: 'Church Service',
          denominations: 'Anglican',
          price: 0,
          organizer: 'St. Mary\'s Church',
          available_tickets: 200,
          image: 'https://images.unsplash.com/photo-1576919228236-a097c32a5cd4?w=800&auto=format&fit=crop&q=60'
        },
        'new-year-prayer-meeting-2025': {
          id: 'fallback-2',
          slug: 'new-year-prayer-meeting-2025',
          title: 'New Year Prayer Meeting 2025',
          description: 'Start the new year with prayer and reflection. Join us for a powerful time of worship, prayer, and seeking God\'s guidance for the year ahead.',
          date: '2025-01-01',
          time: '10:00',
          duration: '3 hours',
          location: 'Community Centre, Manchester',
          category: 'Prayer Meeting',
          denominations: 'Non-denominational',
          price: 0,
          organizer: 'Manchester Christian Fellowship',
          available_tickets: 150,
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=60'
        },
        'easter-celebration-2025': {
          id: 'fallback-3',
          slug: 'easter-celebration-2025',
          title: 'Easter Celebration 2025',
          description: 'Celebrate the resurrection of Jesus Christ with us in this joyful Easter service. Featuring special music, testimonies, and a powerful message of hope.',
          date: '2025-04-20',
          time: '09:00',
          duration: '2.5 hours',
          location: 'Birmingham Cathedral, Birmingham',
          category: 'Special Events',
          denominations: 'Methodist',
          price: 0,
          organizer: 'Birmingham Methodist Church',
          available_tickets: 300,
          image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&auto=format&fit=crop&q=60'
        }
      };

      const fallbackEvent = fallbackEvents[slug as keyof typeof fallbackEvents];
      if (fallbackEvent) {
        setEvent(fallbackEvent);
      } else {
        toast({
          title: "Error",
          description: "Failed to load event details",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!user || !event?.id) return;

    try {
      const { data, error } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .eq("status", "registered")
        .single();

      setIsRegistered(!!data);
    } catch (error) {
      // No registration found, which is fine
      setIsRegistered(false);
    }
  };

  const checkCalendarStatus = async () => {
    if (!user || !event?.id) return;

    try {
      const { data, error } = await supabase
        .from("user_calendar")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .single();

      setIsInCalendar(!!data);
    } catch (error) {
      // Not in calendar, which is fine
      setIsInCalendar(false);
    }
  };

  const handlePurchaseTicket = async () => {
    if (!user || !event) {
      navigate("/auth");
      return;
    }

    setPaymentLoading(true);
    try {
      // Get user profile for email/name
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user.id)
        .single();

      // Handle FREE events (price = 0 or null)
      if (!event.price || event.price === 0) {
        const response = await supabase.functions.invoke("create-free-ticket", {
          body: {
            eventId: event.id,
            eventSlug: event.slug,
            eventTitle: event.title,
            quantity: 1,
            eventDate: event.date,
            eventTime: event.time,
            eventLocation: event.location,
          },
        });

        if (response.error) throw response.error;

        toast({
          title: "Ticket Confirmed! 🎉",
          description: "Your free ticket has been reserved. Check My Tickets to view it.",
        });
        
        navigate("/my-tickets");
        return;
      }

      // Handle PAID events
      const response = await supabase.functions.invoke("create-ticket-payment", {
        body: {
          eventId: event.slug,
          eventTitle: event.title,
          price: event.price,
          quantity: 1,
          buyerEmail: profile?.email || user.email,
          buyerName: profile?.full_name || "Guest",
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
        },
      });

      if (response.error) throw response.error;
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      }
    } catch (error: any) {
      console.error("Error processing ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user || !event) {
      navigate("/auth");
      return;
    }

    // Prevent multiple clicks while processing
    if (registering || isRegistered) return;

    setRegistering(true);
    try {
      // Check if already registered before attempting insert
      const { data: existingRegistration } = await supabase
        .from("event_registrations")
        .select("id")
        .eq("user_id", user.id)
        .eq("event_id", event.id)
        .eq("status", "registered")
        .single();

      if (existingRegistration) {
        setIsRegistered(true);
        toast({
          title: "Already Registered",
          description: "You are already registered for this event.",
        });
        return;
      }

      const { error } = await supabase
        .from("event_registrations")
        .insert([
          {
            user_id: user.id,
            event_id: event.id,
          },
        ]);

      if (error) {
        // Handle duplicate key constraint specifically
        if (error.code === "23505") {
          setIsRegistered(true);
          toast({
            title: "Already Registered",
            description: "You are already registered for this event.",
          });
          return;
        }
        throw error;
      }

      setIsRegistered(true);
      toast({
        title: "Registration Successful!",
        description: "You have successfully registered for this event.",
      });
    } catch (error: any) {
      console.error("Error registering for event:", error);
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleAddToCalendar = async () => {
    if (!user || !event || !isRegistered) return;

    setCalendarLoading(true);
    try {
      if (isInCalendar) {
        // Remove from personal calendar
        const { error } = await supabase
          .from("user_calendar")
          .delete()
          .eq("user_id", user.id)
          .eq("event_id", event.id);

        if (error) throw error;

        setIsInCalendar(false);
        toast({
          title: "Removed from Calendar",
          description: "Event has been removed from your personal calendar.",
        });
      } else {
        // Add to personal calendar
        const { error } = await supabase
          .from("user_calendar")
          .insert([
            {
              user_id: user.id,
              event_id: event.id,
            },
          ]);

        if (error) throw error;

        // Generate and download calendar file
        const startDate = new Date(`${event.date}T${event.time}`);
        const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours

        const formatDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        const icsContent = [
          'BEGIN:VCALENDAR',
          'VERSION:2.0',
          'PRODID:-//ChurchEvents//Event//EN',
          'BEGIN:VEVENT',
          `UID:${event.id}@churchevents.com`,
          `DTSTART:${formatDate(startDate)}`,
          `DTEND:${formatDate(endDate)}`,
          `SUMMARY:${event.title}`,
          `DESCRIPTION:${event.description}`,
          `LOCATION:${event.location}`,
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setIsInCalendar(true);
        toast({
          title: "Added to Calendar",
          description: "Event has been added to your personal calendar and downloaded.",
        });

        // Navigate to calendar page with event highlighted
        setTimeout(() => {
          navigate(`/calendar?highlight=${event.id}&date=${event.date}`);
        }, 1000);
      }
    } catch (error: any) {
      console.error("Error updating calendar:", error);
      toast({
        title: "Calendar Update Failed",
        description: error.message || "Failed to update calendar",
        variant: "destructive",
      });
    } finally {
      setCalendarLoading(false);
    }
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

  const isSalesEnded = () => {
    if (!event) return false;
    const eventDateTime = new Date(`${event.date}T${event.time}`);
    const now = new Date();
    return eventDateTime <= now;
  };

  if (loading) {
    return (
      <>
        <SEOHead 
          title="Loading Event... | MyEcclesia"
          description="Loading event details..."
          canonicalUrl={`https://myecclesia.org.uk/events/${slug}`}
        />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="text-lg">Loading event details...</div>
          </div>
        </div>
      </>
    );
  }

  if (!event) {
    return (
      <>
        <SEOHead 
          title="Event Not Found | MyEcclesia"
          description="The event you're looking for doesn't exist."
          canonicalUrl={`https://myecclesia.org.uk/events/${slug}`}
          noIndex={true}
        />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
            <Button onClick={() => navigate("/events")}>Back to Events</Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${event.title} | MyEcclesia Events`}
        description={event?.description?.slice(0, 160) || "Join this Christian event with MyEcclesia. Book your tickets now!"}
        keywords={`${event?.category || 'Christian event'}, ${event?.denominations || 'church'}, UK events, ${event?.location || 'community'}`}
        canonicalUrl={`https://myecclesia.org.uk/events/${event?.slug ?? slug}`}
        ogImage={event?.image}
      />
      <StructuredData data={createEventSchema(event)} />
      <div className="min-h-screen bg-background">
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/events", { state: { from: 'event-detail' } })}
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
                  loading="lazy"
                  decoding="async"
                  style={{
                    imageRendering: 'auto',
                    WebkitBackfaceVisibility: 'hidden',
                    backfaceVisibility: 'hidden'
                  }}
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge variant="secondary" className="bg-white/90 text-foreground">
                    {event.category}
                  </Badge>
                  {event.denominations && (
                    <Badge variant="outline" className="bg-white/90 text-foreground border-primary">
                      {event.denominations}
                    </Badge>
                  )}
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
                      £{event.price}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-4">{event.title}</h1>
                  <div 
                    className="text-muted-foreground text-lg leading-relaxed prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(event.description || '') }}
                  />
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

                {(event.organizer || event.requirements || event.denominations) && (
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {event.organizer && <p><strong>Organizer:</strong> {event.organizer}</p>}
                      {event.denominations && <p><strong>Denomination:</strong> {event.denominations}</p>}
                      {event.requirements && <p><strong>Requirements:</strong> {event.requirements}</p>}
                      {event.duration && <p><strong>Duration:</strong> {event.duration}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Registration */}
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Event Registration</CardTitle>
                  <CardDescription>
                    {event.ticket_url || event.external_url 
                      ? "Get tickets from the organizer" 
                      : event.price === 0 
                        ? "This event is free to attend" 
                        : `Event fee: £${event.price}`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* External ticket link - prioritize this */}
                  {(event.ticket_url || event.external_url) ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                        <h4 className="font-semibold text-primary mb-2">External Registration</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Tickets for this event are managed by the organizer.
                        </p>
                        <Button 
                          className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
                          onClick={() => window.open(event.ticket_url || event.external_url, '_blank')}
                        >
                          <Ticket className="h-4 w-4 mr-2" />
                          Get Tickets
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>You'll be redirected to the organizer's website to complete your registration.</p>
                      </div>
                    </div>
                  ) : isSalesEnded() ? (
                    <div className="p-4 bg-muted/50 border border-muted rounded-lg text-center">
                      <h4 className="font-semibold text-muted-foreground mb-2">Sales Ended</h4>
                      <p className="text-sm text-muted-foreground">
                        Registration for this event is no longer available.
                      </p>
                    </div>
                  ) : user ? (
                    <div className="space-y-4">
                      {isRegistered ? (
                        <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-success" />
                            <h4 className="font-semibold text-success">Registered!</h4>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            You're registered for this event. Check your dashboard or My Tickets for details.
                          </p>
                          <div className="space-y-2">
                            <Button 
                              variant="outline"
                              className="w-full"
                              onClick={() => navigate("/my-tickets")}
                            >
                              <Ticket className="h-4 w-4 mr-2" />
                              View My Tickets
                            </Button>
                            <Button 
                              variant={isInCalendar ? "destructive" : "outline"}
                              className="w-full"
                              onClick={handleAddToCalendar}
                              disabled={calendarLoading}
                            >
                              {isInCalendar ? (
                                <>
                                  <CalendarMinus className="h-4 w-4 mr-2" />
                                  {calendarLoading ? "Removing..." : "Remove from Calendar"}
                                </>
                              ) : (
                                <>
                                  <CalendarPlus className="h-4 w-4 mr-2" />
                                  {calendarLoading ? "Adding..." : "Add to Calendar"}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* In-platform ticket purchase for events without external links */}
                          <TicketPurchase 
                            event={{
                              id: event.id,
                              slug: event.slug,
                              title: event.title,
                              price: event.price || 0,
                              date: event.date,
                              time: event.time,
                              location: event.location,
                            }}
                          />
                          <div className="text-xs text-muted-foreground">
                            <p>
                              {event.price > 0 
                                ? "After payment, your ticket will be available in My Tickets."
                                : "Your ticket will be instantly available in My Tickets."
                              }
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-muted/50 border border-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Sign Up Required</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please create an account to register for events.
                        </p>
                        <Button 
                          className="w-full"
                          onClick={() => navigate("/auth")}
                        >
                          Sign Up / Sign In
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <p>
                          Creating an account is quick and gives you access to all our events.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default EventDetail;
