import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Search, Download, CheckCircle, Clock, Ticket,
  RefreshCw, CalendarDays, DollarSign, UserCheck,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

interface MyEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  registration_type: string;
}

interface RegistrationRecord {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  status: string;
  event?: MyEvent;
  profile?: { full_name: string | null; email: string | null };
}

interface TicketRecord {
  id: string;
  event_id: string;
  user_id: string;
  quantity: number;
  status: string;
  check_in_status: string | null;
  checked_in_at: string | null;
  created_at: string;
  payment_metadata: { amount_total?: number; currency?: string } | null;
  event?: MyEvent;
  profile?: { full_name: string | null; email: string | null };
}

const MyAttendees = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>([]);
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    if (user) fetchAll();
  }, [user]);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Fetch organizer's events
      const { data: events, error: eventsErr } = await supabase
        .from("events")
        .select("id, title, date, time, registration_type")
        .eq("created_by", user.id)
        .order("date", { ascending: false });

      if (eventsErr) throw eventsErr;
      setMyEvents(events || []);

      const eventIds = (events || []).map((e) => e.id);
      if (eventIds.length === 0) {
        setRegistrations([]);
        setTickets([]);
        setLoading(false);
        return;
      }

      const eventMap = new Map((events || []).map((e) => [e.id, e]));

      // 2. Fetch RSVPs/registrations
      const { data: regs, error: regsErr } = await supabase
        .from("event_registrations")
        .select("id, event_id, user_id, registered_at, status")
        .in("event_id", eventIds)
        .order("registered_at", { ascending: false });

      if (regsErr) throw regsErr;

      // 2b. Fetch guest RSVPs
      const { data: guestRegs } = await supabase
        .from("guest_rsvps")
        .select("id, event_id, full_name, email, status, created_at")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });

      // 3. Fetch tickets
      const { data: tix, error: tixErr } = await supabase
        .from("tickets")
        .select("id, event_id, user_id, quantity, status, check_in_status, checked_in_at, created_at, payment_metadata")
        .in("event_id", eventIds)
        .order("created_at", { ascending: false });

      if (tixErr) throw tixErr;

      // 4. Fetch profiles for all attendees
      const allUserIds = [
        ...new Set([
          ...(regs || []).map((r) => r.user_id),
          ...(tix || []).map((t) => t.user_id),
        ]),
      ];

      let profileMap = new Map<string, { full_name: string | null; email: string | null }>();
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, email")
          .in("user_id", allUserIds);
        profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      }

      // Combine authenticated registrations and guest RSVPs
      const authRegs: RegistrationRecord[] = (regs || []).map((r) => ({
        ...r,
        event: eventMap.get(r.event_id),
        profile: profileMap.get(r.user_id),
      }));

      const guestRegsFormatted: RegistrationRecord[] = (guestRegs || []).map((g) => ({
        id: g.id,
        event_id: g.event_id,
        user_id: `guest-${g.id}`,
        registered_at: g.created_at,
        status: g.status,
        event: eventMap.get(g.event_id),
        profile: { full_name: `${g.full_name} (Guest)`, email: g.email },
      }));

      setRegistrations([...authRegs, ...guestRegsFormatted]);

      setTickets(
        (tix || []).map((t) => ({
          ...t,
          event: eventMap.get(t.event_id),
          profile: profileMap.get(t.user_id),
          payment_metadata: t.payment_metadata as TicketRecord["payment_metadata"],
        }))
      );
    } catch (error) {
      console.error("Error fetching attendees:", error);
      toast({ title: "Error", description: "Failed to load attendee data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Filtering helpers
  const filterList = <T extends { event_id: string; profile?: { full_name: string | null; email: string | null }; status: string }>(
    list: T[]
  ) => {
    let filtered = [...list];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.profile?.full_name?.toLowerCase().includes(s) ||
          r.profile?.email?.toLowerCase().includes(s)
      );
    }
    if (selectedEvent !== "all") {
      filtered = filtered.filter((r) => r.event_id === selectedEvent);
    }
    if (selectedStatus !== "all") {
      filtered = filtered.filter((r) => r.status === selectedStatus);
    }
    return filtered;
  };

  const filteredRegs = filterList(registrations);
  const filteredTickets = filterList(tickets);

  // Stats
  const rsvpCount = registrations.filter((r) => r.status === "registered").length;
  const ticketCount = tickets.filter((t) => t.status === "confirmed").reduce((s, t) => s + (t.quantity || 1), 0);
  const totalRevenue =
    tickets
      .filter((t) => t.status === "confirmed")
      .reduce((s, t) => s + (t.payment_metadata?.amount_total || 0), 0) / 100;
  const checkedIn = tickets.filter((t) => t.check_in_status === "checked_in").length;

  // CSV export
  const exportRsvpCsv = () => {
    const rows = [
      ["Name", "Email", "Event", "RSVP Date", "Status"].join(","),
      ...filteredRegs.map((r) =>
        [
          `"${r.profile?.full_name || "N/A"}"`,
          `"${r.profile?.email || "N/A"}"`,
          `"${r.event?.title || "N/A"}"`,
          `"${format(new Date(r.registered_at), "yyyy-MM-dd HH:mm")}"`,
          `"${r.status}"`,
        ].join(",")
      ),
    ].join("\n");
    downloadCsv(rows, "rsvp-attendees");
  };

  const exportTicketsCsv = () => {
    const rows = [
      ["Ticket ID", "Name", "Email", "Event", "Qty", "Status", "Check-in", "Date"].join(","),
      ...filteredTickets.map((t) =>
        [
          `"${t.id.slice(0, 8).toUpperCase()}"`,
          `"${t.profile?.full_name || "N/A"}"`,
          `"${t.profile?.email || "N/A"}"`,
          `"${t.event?.title || "N/A"}"`,
          t.quantity || 1,
          `"${t.status}"`,
          `"${t.check_in_status || "pending"}"`,
          `"${format(new Date(t.created_at), "yyyy-MM-dd HH:mm")}"`,
        ].join(",")
      ),
    ].join("\n");
    downloadCsv(rows, "ticket-attendees");
  };

  const downloadCsv = (content: string, name: string) => {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export Complete", description: "CSV file downloaded" });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">Loading attendees...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground">You need to be signed in to manage attendees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="My Attendees | MyEcclesia" description="Manage attendees for your events" noIndex />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Attendees</h1>
            <p className="text-muted-foreground">Manage RSVPs and tickets for your events</p>
          </div>
          <Button variant="outline" onClick={fetchAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <UserCheck className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{rsvpCount}</div>
                  <div className="text-sm text-muted-foreground">RSVPs</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <Ticket className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{ticketCount}</div>
                  <div className="text-sm text-muted-foreground">Tickets Sold</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">£{totalRevenue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Revenue</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{checkedIn}</div>
                  <div className="text-sm text-muted-foreground">Checked In</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {myEvents.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[150px]">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {myEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
              <p className="text-muted-foreground mb-4">Create an event to start tracking attendees.</p>
              <Button onClick={() => navigate("/my-profiles")}>Create Event</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="rsvps" className="space-y-4">
            <TabsList>
              <TabsTrigger value="rsvps" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                RSVPs ({filteredRegs.length})
              </TabsTrigger>
              <TabsTrigger value="tickets" className="flex items-center gap-1">
                <Ticket className="h-3 w-3" />
                Tickets ({filteredTickets.length})
              </TabsTrigger>
            </TabsList>

            {/* RSVPs Tab */}
            <TabsContent value="rsvps">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">RSVP Attendees</CardTitle>
                    <CardDescription>People who have RSVP'd to your events</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportRsvpCsv} disabled={filteredRegs.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRegs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                              No RSVPs found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredRegs.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell className="font-medium">{r.profile?.full_name || "N/A"}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{r.profile?.email || "N/A"}</TableCell>
                              <TableCell>
                                <div className="max-w-[200px] truncate">{r.event?.title || "N/A"}</div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(r.registered_at), "MMM dd, HH:mm")}
                              </TableCell>
                              <TableCell>
                                <Badge variant={r.status === "registered" ? "default" : "secondary"}>
                                  {r.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    Showing {filteredRegs.length} of {registrations.length} RSVPs
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <div>
                    <CardTitle className="text-lg">Ticket Holders</CardTitle>
                    <CardDescription>People who purchased tickets for your events</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={exportTicketsCsv} disabled={filteredTickets.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ticket ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Event</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Check-in</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTickets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No tickets found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredTickets.map((t) => (
                            <TableRow key={t.id}>
                              <TableCell className="font-mono text-sm">
                                {t.id.slice(0, 8).toUpperCase()}
                              </TableCell>
                              <TableCell>
                                <div>{t.profile?.full_name || "N/A"}</div>
                                <div className="text-xs text-muted-foreground">{t.profile?.email || ""}</div>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[200px] truncate">{t.event?.title || "N/A"}</div>
                              </TableCell>
                              <TableCell>{t.quantity || 1}</TableCell>
                              <TableCell>
                                <Badge variant={t.status === "confirmed" ? "default" : "secondary"}>
                                  {t.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {t.check_in_status === "checked_in" ? (
                                  <Badge className="bg-primary text-primary-foreground">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    In
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(new Date(t.created_at), "MMM dd, HH:mm")}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="text-sm text-muted-foreground mt-4">
                    Showing {filteredTickets.length} of {tickets.length} tickets
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MyAttendees;
