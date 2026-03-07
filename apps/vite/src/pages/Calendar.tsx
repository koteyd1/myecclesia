import { useEffect, useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Plus, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { SEOHead } from "@/components/SEOHead";
import EventListItem from "@/components/EventListItem";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  location: string;
  description?: string;
  image?: string;
  price?: number;
  slug?: string;
  isPersonal?: boolean;
  calendarId?: string;
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    fetchEvents();
    if (user) {
      fetchPersonalCalendarEvents();
    }
    
    const highlightEventId = searchParams.get('highlight');
    const eventDate = searchParams.get('date');
    
    if (highlightEventId) {
      setHighlightedEventId(highlightEventId);
      if (eventDate) {
        const parsedDate = parseISO(eventDate);
        setCurrentMonth(parsedDate);
        setSelectedDate(parsedDate);
      }
      toast({
        title: "Event Added to Calendar",
        description: "The event is highlighted below.",
      });
    }
  }, [searchParams, toast, user]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, slug, title, date, time, category, location, description, image, price")
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
            slug,
            title,
            date,
            time,
            category,
            location,
            description,
            image,
            price
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const personalEventsData = data?.map(item => ({
        ...item.events,
        isPersonal: true,
        calendarId: item.id
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

  // Calendar calculations
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const allEvents = useMemo(() => {
    const combined = [...events, ...personalEvents];
    // Remove duplicates by id
    const unique = combined.filter((event, index, self) => 
      index === self.findIndex(e => e.id === event.id)
    );
    return unique;
  }, [events, personalEvents]);

  const getEventsForDay = (day: Date) => {
    return allEvents.filter(event => isSameDay(parseISO(event.date), day));
  };

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDay(selectedDate);
  }, [selectedDate, allEvents]);

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Worship': 'bg-blue-500',
      'Youth': 'bg-green-500',
      'Community': 'bg-purple-500',
      'Education': 'bg-orange-500',
      'Special Event': 'bg-red-500',
      'Retreat': 'bg-indigo-500',
      'Conference': 'bg-pink-500',
    };
    return colors[category] || 'bg-primary';
  };

  // Upcoming events for list view
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    return allEvents
      .filter(event => parseISO(event.date) >= today)
      .slice(0, 20);
  }, [allEvents]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calendar...</p>
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <CalendarIcon className="h-8 w-8 text-primary" />
              Event Calendar
            </h1>
            <p className="text-muted-foreground mt-1">
              View and plan your upcoming events
            </p>
          </div>
          
          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("calendar")}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              Calendar
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4 mr-1.5" />
              List
            </Button>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {format(currentMonth, "MMMM yyyy")}
                  </h2>
                  <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
                
                <CardContent className="p-4">
                  {/* Weekday Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.charAt(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const hasHighlightedEvent = dayEvents.some(e => e.id === highlightedEventId);
                      
                      return (
                        <button
                          key={day.toISOString()}
                          onClick={() => setSelectedDate(day)}
                          className={`
                            relative min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 rounded-lg text-left transition-all
                            ${isCurrentMonth ? 'bg-card hover:bg-accent/50' : 'bg-muted/20 text-muted-foreground'}
                            ${isToday(day) ? 'ring-2 ring-primary' : ''}
                            ${isSelected ? 'bg-primary/10 ring-2 ring-primary' : ''}
                            ${hasHighlightedEvent ? 'bg-green-50 dark:bg-green-950/30' : ''}
                          `}
                        >
                          <span className={`
                            inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full text-sm font-medium
                            ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                          `}>
                            {format(day, 'd')}
                          </span>
                          
                          {/* Event Dots/Badges */}
                          <div className="mt-1 space-y-0.5 overflow-hidden">
                            {dayEvents.slice(0, 3).map((event) => (
                              <div
                                key={event.id}
                                className={`
                                  text-xs truncate px-1 py-0.5 rounded
                                  ${event.isPersonal ? 'bg-primary/20 text-primary' : getCategoryColor(event.category) + ' text-white'}
                                  ${event.id === highlightedEventId ? 'ring-1 ring-green-500' : ''}
                                `}
                              >
                                <span className="hidden sm:inline">{event.title}</span>
                                <span className="sm:hidden">•</span>
                              </div>
                            ))}
                            {dayEvents.length > 3 && (
                              <span className="text-xs text-muted-foreground px-1">
                                +{dayEvents.length - 3}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Selected Day Events Panel */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-lg">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d") : "Select a date"}
                  </h3>
                  {selectedDate && (
                    <p className="text-sm text-muted-foreground">
                      {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                    </p>
                  )}
                </div>
                <CardContent className="p-4 max-h-[500px] overflow-y-auto">
                  {selectedDate ? (
                    selectedDateEvents.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateEvents.map((event) => (
                          <div
                            key={event.id}
                            className={`
                              group p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md
                              ${event.isPersonal ? 'border-primary/30 bg-primary/5' : 'border-border hover:border-primary/30'}
                              ${event.id === highlightedEventId ? 'ring-2 ring-green-500' : ''}
                            `}
                            onClick={() => navigate(`/events/${event.slug || event.id}`)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                  {event.isPersonal && <span className="mr-1">📅</span>}
                                  {event.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {event.time} · {event.location}
                                </p>
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  {event.category}
                                </Badge>
                              </div>
                              {event.isPersonal && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeFromPersonalCalendar(event.id);
                                  }}
                                  className="p-1.5 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <CalendarIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No events on this day</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => navigate("/events")}
                        >
                          <Plus className="h-4 w-4 mr-1.5" />
                          Browse Events
                        </Button>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">Click on a date to see events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            <Card>
              <div className="p-4 border-b">
                <h2 className="font-semibold text-lg">Upcoming Events</h2>
                <p className="text-sm text-muted-foreground">
                  {upcomingEvents.length} upcoming event{upcomingEvents.length !== 1 ? 's' : ''}
                </p>
              </div>
              <CardContent className="p-4">
                {upcomingEvents.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingEvents.map((event) => (
                      <EventListItem
                        key={event.id}
                        id={event.id}
                        slug={event.slug}
                        title={event.title}
                        date={event.date}
                        time={event.time}
                        location={event.location}
                        description={event.description}
                        image={event.image || "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop"}
                        price={event.price || 0}
                        category={event.category || "Event"}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming events found</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => navigate("/events")}
                    >
                      Browse All Events
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Personal Calendar Events */}
            {user && personalEvents.length > 0 && (
              <Card>
                <div className="p-4 border-b">
                  <h2 className="font-semibold text-lg flex items-center gap-2">
                    <span>📅</span>
                    My Calendar Events ({personalEvents.length})
                  </h2>
                </div>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {personalEvents.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => navigate(`/events/${event.slug || event.id}`)}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(parseISO(event.date), "MMM d, yyyy")} · {event.time}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromPersonalCalendar(event.id);
                          }}
                          className="p-2 rounded-full bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Calendar;
