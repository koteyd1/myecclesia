import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Filter, X, Calendar, Eye, Trash2 } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface AdminRegistrationsProps {
  user: any;
}

export const AdminRegistrations = ({ user }: AdminRegistrationsProps) => {
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    fetchRegistrations();
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .order("title");

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const fetchRegistrations = async () => {
    try {
      const { data: registrations, error: registrationsError } = await supabase
        .from("event_registrations")
        .select("*")
        .order("registered_at", { ascending: false });

      if (registrationsError) throw registrationsError;

      // Fetch events and profiles separately
      const { data: events, error: eventsError } = await supabase
        .from("events")
        .select("id, title, date, time, location");

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, email, phone");

      if (eventsError || profilesError) {
        throw eventsError || profilesError;
      }

      // Combine registrations with events and profiles
      const registrationsWithDetails = registrations?.map(registration => ({
        ...registration,
        events: events?.find(event => event.id === registration.event_id),
        profiles: profiles?.find(profile => profile.user_id === registration.user_id)
      })) || [];

      setRegistrations(registrationsWithDetails);
      setFilteredRegistrations(registrationsWithDetails);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load registrations.",
      });
    }
  };

  const handleDeleteRegistration = async (registrationId) => {
    if (!confirm("Are you sure you want to delete this registration?")) return;

    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Registration deleted successfully.",
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Error deleting registration:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete registration.",
      });
    }
  };

  const handleUpdateRegistrationStatus = async (registrationId, newStatus) => {
    try {
      const { error } = await supabase
        .from("event_registrations")
        .update({ status: newStatus })
        .eq("id", registrationId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Registration status updated successfully.",
      });

      fetchRegistrations();
    } catch (error) {
      console.error("Error updating registration status:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update registration status.",
      });
    }
  };

  // Filter registrations based on search and filter criteria
  const applyFilters = () => {
    let filtered = registrations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(registration => 
        registration.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        registration.events?.title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Event filter
    if (selectedEvent && selectedEvent !== "all") {
      filtered = filtered.filter(registration => registration.event_id === selectedEvent);
    }

    // Status filter
    if (selectedStatus && selectedStatus !== "all") {
      filtered = filtered.filter(registration => registration.status === selectedStatus);
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(registration => 
        new Date(registration.registered_at) >= dateFrom
      );
    }

    if (dateTo) {
      filtered = filtered.filter(registration => 
        new Date(registration.registered_at) <= dateTo
      );
    }

    setFilteredRegistrations(filtered);
  };

  // Apply filters whenever filter criteria change
  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedEvent, selectedStatus, dateFrom, dateTo, registrations]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedEvent("all");
    setSelectedStatus("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const handleRegistrationSearch = (query: string) => {
    setSearchTerm(query);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registered":
        return "default";
      case "cancelled":
        return "destructive";
      case "attended":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Registration Management</h2>
        <Badge variant="outline">
          {filteredRegistrations.length} registration{filteredRegistrations.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <SearchBar
          onSearch={handleRegistrationSearch}
          placeholder="Search by user name, email, or event..."
          value={searchTerm}
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="attended">Attended</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, "PPP") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateFrom}
                onSelect={setDateFrom}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, "PPP") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={dateTo}
                onSelect={setDateTo}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button onClick={clearFilters} variant="ghost" size="sm">
            <X className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Registrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRegistrations.map((registration) => (
          <Card key={registration.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {registration.profiles?.full_name || "Unknown User"}
                  </CardTitle>
                  <CardDescription>{registration.profiles?.email}</CardDescription>
                </div>
                <Badge variant={getStatusColor(registration.status)}>
                  {registration.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium text-primary">
                  {registration.events?.title || "Unknown Event"}
                </div>
                {registration.events && (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p><strong>Date:</strong> {new Date(registration.events.date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> {registration.events.time}</p>
                    <p><strong>Location:</strong> {registration.events.location}</p>
                  </div>
                )}
              </div>

              {registration.profiles?.phone && (
                <div className="text-sm">
                  <strong>Phone:</strong> {registration.profiles.phone}
                </div>
              )}

              <div className="text-sm text-muted-foreground">
                <p><strong>Registered:</strong> {new Date(registration.registered_at).toLocaleDateString()}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Update Status:</label>
                <Select 
                  value={registration.status} 
                  onValueChange={(newStatus) => handleUpdateRegistrationStatus(registration.id, newStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="registered">Registered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="attended">Attended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-2">
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => handleDeleteRegistration(registration.id)}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Registration
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRegistrations.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No registrations found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};