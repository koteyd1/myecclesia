import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, CheckCircle, Eye, Trash2, Filter, X, ThumbsDown, ThumbsUp } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminEventReviewProps {
  user: any;
}

export const AdminEventReview = ({ user }: AdminEventReviewProps) => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [suspiciousFilter, setSuspiciousFilter] = useState("all");
  const { toast } = useToast();

  // Keywords that might indicate non-Christian events
  const suspiciousKeywords = [
    'secular', 'non-religious', 'atheist', 'pagan', 'hindu', 'buddhist', 'muslim', 'islamic', 'jewish', 'synagogue', 'mosque', 'temple',
    'alcohol', 'bar', 'pub', 'nightclub', 'casino', 'gambling', 'poker', 'betting',
    'political rally', 'protest', 'demonstration', 'activism',
    'occult', 'witchcraft', 'magic', 'tarot', 'astrology', 'horoscope',
    'new age', 'meditation retreat', 'yoga retreat', 'chakra', 'reiki',
    'dating', 'singles night', 'speed dating', 'hookup',
    'halloween party', 'satanic', 'devil worship'
  ];

  useEffect(() => {
    fetchAllEvents();
  }, []);

  const fetchAllEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const eventsWithFlags = data?.map(event => ({
        ...event,
        suspicious: checkSuspiciousContent(event),
        suspiciousReasons: getSuspiciousReasons(event)
      })) || [];

      setEvents(eventsWithFlags);
      setFilteredEvents(eventsWithFlags);
      // Re-apply current filters
      setTimeout(() => applyFilters(searchQuery, reviewFilter, suspiciousFilter), 0);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events for review.",
      });
    }
  };

  const checkSuspiciousContent = (event) => {
    const textToCheck = `${event.title} ${event.description} ${event.category} ${event.organizer}`.toLowerCase();
    return suspiciousKeywords.some(keyword => textToCheck.includes(keyword.toLowerCase()));
  };

  const getSuspiciousReasons = (event) => {
    const textToCheck = `${event.title} ${event.description} ${event.category} ${event.organizer}`.toLowerCase();
    return suspiciousKeywords.filter(keyword => textToCheck.includes(keyword.toLowerCase()));
  };

  const handleEventSearch = (query: string) => {
    setSearchQuery(query);
    applyFilters(query, reviewFilter, suspiciousFilter);
  };

  const applyFilters = (search = searchQuery, review = reviewFilter, suspicious = suspiciousFilter) => {
    let filtered = events;

    // Search filter
    if (search) {
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.description?.toLowerCase().includes(search.toLowerCase()) ||
        event.organizer?.toLowerCase().includes(search.toLowerCase()) ||
        event.category?.toLowerCase().includes(search.toLowerCase()) ||
        event.location?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Suspicious content filter
    if (suspicious === "suspicious") {
      filtered = filtered.filter(event => event.suspicious);
    } else if (suspicious === "clean") {
      filtered = filtered.filter(event => !event.suspicious);
    }

    // Approval status filter
    if (review && review !== "all") {
      filtered = filtered.filter((event) => event.approval_status === review);
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === "review") {
      setReviewFilter(value);
      applyFilters(searchQuery, value, suspiciousFilter);
    } else if (filterType === "suspicious") {
      setSuspiciousFilter(value);
      applyFilters(searchQuery, reviewFilter, value);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setReviewFilter("all");
    setSuspiciousFilter("all");
    setFilteredEvents(events);
  };

  const handleApproveEvent = async (eventId: string, eventTitle: string) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({
          approval_status: "approved",
          approved_at: new Date().toISOString(),
          approved_by: user?.id || null,
          rejected_at: null,
          rejected_by: null,
          rejection_reason: null,
        })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Approved",
        description: `“${eventTitle}” is now live on the platform.`,
      });

      fetchAllEvents();
    } catch (error) {
      console.error("Error approving event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve event.",
      });
    }
  };

  const handleRejectEvent = async (eventId: string, eventTitle: string) => {
    const reason = prompt(`Reject “${eventTitle}”? Optionally add a reason for the organizer:`) || null;
    try {
      const { error } = await supabase
        .from("events")
        .update({
          approval_status: "rejected",
          rejected_at: new Date().toISOString(),
          rejected_by: user?.id || null,
          rejection_reason: reason,
          approved_at: null,
          approved_by: null,
        })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Rejected",
        description: `“${eventTitle}” has been rejected.`,
      });

      fetchAllEvents();
    } catch (error) {
      console.error("Error rejecting event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject event.",
      });
    }
  };

  const handleDeleteEvent = async (eventId, eventTitle) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Event deleted successfully.",
      });

      fetchAllEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event.",
      });
    }
  };

  const suspiciousCount = events.filter(event => event.suspicious).length;
  const totalCount = events.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Event Content Review</h2>
          <p className="text-muted-foreground">Review events for Christian appropriateness</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">
            <Badge variant="outline">{totalCount} total events</Badge>
            {suspiciousCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {suspiciousCount} flagged
              </Badge>
            )}
          </div>
        </div>
      </div>

      {suspiciousCount > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {suspiciousCount} event{suspiciousCount > 1 ? 's have' : ' has'} been flagged for potential non-Christian content. 
            Please review these events carefully.
          </AlertDescription>
        </Alert>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          onSearch={handleEventSearch}
          placeholder="Search events by title, description, organizer..."
          value={searchQuery}
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={reviewFilter} onValueChange={(value) => handleFilterChange("review", value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Approval Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Approval Statuses</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>

          <Select value={suspiciousFilter} onValueChange={(value) => handleFilterChange("suspicious", value)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Content Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="suspicious">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
                  Flagged Events
                </div>
              </SelectItem>
              <SelectItem value="clean">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                  Clean Events
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={clearFilters} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className={event.suspicious ? "border-destructive/50 bg-destructive/5" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {event.title}
                    {event.suspicious && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </CardTitle>
                  <CardDescription>{event.organizer}</CardDescription>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant={event.suspicious ? "destructive" : "secondary"}>
                    {event.suspicious ? "Flagged" : "Clean"}
                  </Badge>
                  <Badge
                    variant={
                      event.approval_status === "approved"
                        ? "secondary"
                        : event.approval_status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                    className="text-xs"
                  >
                    {event.approval_status || "approved"}
                  </Badge>
                  {event.category && (
                    <Badge variant="outline" className="text-xs">
                      {event.category}
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm">
                <p className="line-clamp-3 text-muted-foreground mb-2">
                  {event.description}
                </p>
                <div className="space-y-1">
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Location:</strong> {event.location}</p>
                  <p><strong>Price:</strong> £{event.price}</p>
                </div>
              </div>

              {event.suspicious && event.suspiciousReasons.length > 0 && (
                <div className="bg-destructive/10 p-3 rounded-md">
                  <p className="text-sm font-medium text-destructive mb-1">Flagged Keywords:</p>
                  <div className="flex flex-wrap gap-1">
                    {event.suspiciousReasons.map((reason, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.open(`/events/${event.slug || event.id}`, '_blank')}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => handleApproveEvent(event.id, event.title)}
                  disabled={event.approval_status === "approved"}
                  title={event.approval_status === "approved" ? "Already approved" : "Approve event"}
                >
                  <ThumbsUp className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectEvent(event.id, event.title)}
                  disabled={event.approval_status === "rejected"}
                  title={event.approval_status === "rejected" ? "Already rejected" : "Reject event"}
                >
                  <ThumbsDown className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleDeleteEvent(event.id, event.title)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No events found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};