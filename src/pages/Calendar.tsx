import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  location: string;
  isPersonal?: boolean; // Flag to distinguish personal calendar events
  calendarId?: string; // Store the user_calendar ID for deletion
}

const Calendar = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [personalEvents, setPersonalEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchPersonalCalendarEvents();
    }
    
    // Check for highlighted event from URL params
    const highlightEventId = searchParams.get('highlight');
    const eventDate = searchParams.get('date');
    
    if (highlightEventId) {
      setHighlightedEventId(highlightEventId);
      
      // Set the calendar to show the month of the highlighted event
      if (eventDate) {
        const parsedDate = parseISO(eventDate);
        setCurrentMonth(parsedDate);
      }
      
      // Show success message
      toast({
        title: "Event Added to Calendar",
        description: "The event is highlighted below and has been downloaded to your device.",
      });
    }
  }, [searchParams, toast, user]);

  useEffect(() => {
    if (!searchParams.get('highlight')) {
      fetchEvents();
    }
  }, [searchParams]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, time, category, location")
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonalCalendarEvents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_calendar")
        .select(`
          id,
          events (
            id,
            title,
            date,
            time,
            category,
            location
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const personalEventsData = data?.map(item => ({
        ...item.events,
        isPersonal: true,
        calendarId: item.id // Store the user_calendar ID for deletion
      })) || [];

      setPersonalEvents(personalEventsData);
    } catch (error) {
      console.error("Error fetching personal calendar events:", error);
    }
  };

  const removeFromPersonalCalendar = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("user_calendar")
        .delete()
        .eq("user_id", user.id)
        .eq("event_id", eventId);

      if (error) throw error;

      // Remove from local state
      setPersonalEvents(prev => prev.filter(event => event.id !== eventId));
      
      toast({
        title: "Removed from Calendar",
        description: "Event has been removed from your personal calendar.",
      });
    } catch (error) {
      console.error("Error removing from calendar:", error);
      toast({
        title: "Error",
        description: "Failed to remove event from calendar",
        variant: "destructive",
      });
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    const regularEvents = events.filter(event => 
      isSameDay(parseISO(event.date), day)
    );
    const personalEventsForDay = personalEvents.filter(event => 
      isSameDay(parseISO(event.date), day)
    );
    return [...regularEvents, ...personalEventsForDay];
  };

  const getCategoryColor = (category: string, isPersonal?: boolean) => {
    if (isPersonal) {
      return 'bg-primary/20 text-primary border border-primary/30';
    }
    
    const colors: { [key: string]: string } = {
      'Worship': 'bg-blue-100 text-blue-800',
      'Youth': 'bg-green-100 text-green-800',
      'Community': 'bg-purple-100 text-purple-800',
      'Education': 'bg-orange-100 text-orange-800',
      'Special Event': 'bg-red-100 text-red-800',
      'Retreat': 'bg-indigo-100 text-indigo-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-lg">Loading calendar...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Event Calendar | MyEcclesia"
        description="View all upcoming Christian events in calendar format. Plan your month with church services, conferences, worship nights, and community gatherings across the UK."
        keywords="church calendar, Christian events calendar, UK church events, faith events schedule"
      />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4 flex items-center justify-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Event Calendar
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            View all upcoming events in calendar format. Click on any event to see details and register.
          </p>
        </div>

        <Card className="w-full max-w-6xl mx-auto">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">
                {format(currentMonth, "MMMM yyyy")}
              </CardTitle>
              <Button variant="outline" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="p-2 text-center font-semibold text-muted-foreground">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const hasHighlightedEvent = dayEvents.some(event => event.id === highlightedEventId);
                
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-24 p-2 border border-border ${
                      isCurrentMonth ? 'bg-card' : 'bg-muted/30'
                    } ${isSameDay(day, new Date()) ? 'ring-2 ring-primary' : ''} ${
                      hasHighlightedEvent ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20' : ''
                    }`}
                  >
                    <div className={`text-sm mb-1 ${
                      isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div
                          key={event.id}
                          className="cursor-pointer relative group"
                        >
                          <Badge 
                            variant="secondary" 
                            className={`text-xs p-1 w-full text-center truncate ${getCategoryColor(event.category, event.isPersonal)} ${
                              event.id === highlightedEventId ? 'ring-2 ring-green-500 animate-pulse' : ''
                            }`}
                            onClick={() => navigate(`/events/${event.id}`)}
                          >
                            {event.isPersonal && <span className="mr-1">📅</span>}
                            {event.title}
                          </Badge>
                          {event.isPersonal && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromPersonalCalendar(event.id);
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          )}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events List */}
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 6).map((event) => (
              <Card 
                key={event.id} 
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  event.id === highlightedEventId ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20 animate-pulse' : ''
                }`}
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                    <Badge className={getCategoryColor(event.category)}>
                      {event.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(parseISO(event.date), "MMM dd, yyyy")} at {event.time}
                  </p>
                  <p className="text-sm text-muted-foreground">{event.location}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Personal Calendar Events */}
        {user && personalEvents.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <span>📅</span>
              My Calendar Events ({personalEvents.length})
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {personalEvents.map((event) => (
                <Card 
                  key={event.id} 
                  className={`cursor-pointer hover:shadow-lg transition-shadow border-primary/30 ${
                    event.id === highlightedEventId ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20 animate-pulse' : 'bg-primary/5'
                  }`}
                  onClick={() => navigate(`/events/${event.id}`)}
                >
                  <CardContent className="p-4 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-foreground truncate">{event.title}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getCategoryColor(event.category, true)}>
                          {event.category}
                        </Badge>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPersonalCalendar(event.id);
                          }}
                          className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(event.date), "MMM dd, yyyy")} at {event.time}
                    </p>
                    <p className="text-sm text-muted-foreground">{event.location}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendar;