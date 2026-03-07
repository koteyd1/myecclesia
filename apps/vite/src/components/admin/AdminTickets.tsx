import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Ticket, 
  Search, 
  Download, 
  CheckCircle, 
  Clock, 
  XCircle,
  Users,
  DollarSign,
  Calendar,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface TicketRecord {
  id: string;
  event_id: string;
  user_id: string;
  quantity: number;
  status: string;
  check_in_status: string;
  checked_in_at: string | null;
  created_at: string;
  payment_metadata: {
    amount_total?: number;
    currency?: string;
    quantity?: number;
  } | null;
  events: {
    id: string;
    title: string;
    date: string;
    time: string;
  };
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

interface AdminTicketsProps {
  user?: any;
}

export const AdminTickets = ({ user }: AdminTicketsProps) => {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<TicketRecord[]>([]);
  const [events, setEvents] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [stats, setStats] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    checkedIn: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchTickets();
    fetchEvents();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, searchTerm, selectedEvent, selectedStatus]);

  const fetchTickets = async () => {
    try {
      // Fetch tickets and events separately due to missing FK relationship in types
      const { data: ticketsData, error } = await supabase
        .from("tickets")
        .select("id, event_id, user_id, quantity, status, check_in_status, checked_in_at, created_at, payment_metadata")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch events
      const eventIds = [...new Set((ticketsData || []).map(t => t.event_id))];
      const { data: eventsData } = await supabase
        .from("events")
        .select("id, title, date, time")
        .in("id", eventIds);

      const eventMap = new Map(eventsData?.map(e => [e.id, e]) || []);

      // Fetch profiles
      const userIds = [...new Set((ticketsData || []).map(t => t.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const ticketsWithRelations = (ticketsData || []).map(ticket => ({
        ...ticket,
        events: eventMap.get(ticket.event_id) || null,
        profiles: profileMap.get(ticket.user_id) || null,
      })) as unknown as TicketRecord[];

      setTickets(ticketsWithRelations);
      calculateStats(ticketsWithRelations);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title")
        .order("date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const calculateStats = (ticketList: TicketRecord[]) => {
    const confirmedTickets = ticketList.filter(t => t.status === "confirmed");
    const totalTickets = confirmedTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
    const totalRevenue = confirmedTickets.reduce((sum, t) => {
      const amount = t.payment_metadata?.amount_total || 0;
      return sum + amount;
    }, 0) / 100; // Convert from pence to pounds
    const checkedIn = confirmedTickets.filter(t => t.check_in_status === "checked_in").length;
    const pending = confirmedTickets.filter(t => t.check_in_status !== "checked_in").length;

    setStats({ totalTickets, totalRevenue, checkedIn, pending });
  };

  const filterTickets = () => {
    let filtered = [...tickets];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(search) ||
        t.profiles?.full_name?.toLowerCase().includes(search) ||
        t.profiles?.email?.toLowerCase().includes(search) ||
        t.events?.title?.toLowerCase().includes(search)
      );
    }

    if (selectedEvent !== "all") {
      filtered = filtered.filter(t => t.event_id === selectedEvent);
    }

    if (selectedStatus !== "all") {
      if (selectedStatus === "checked_in") {
        filtered = filtered.filter(t => t.check_in_status === "checked_in");
      } else if (selectedStatus === "not_checked_in") {
        filtered = filtered.filter(t => t.check_in_status !== "checked_in" && t.status === "confirmed");
      } else {
        filtered = filtered.filter(t => t.status === selectedStatus);
      }
    }

    setFilteredTickets(filtered);
  };

  const exportToCSV = () => {
    const headers = ["Ticket ID", "Event", "Attendee Name", "Email", "Quantity", "Status", "Check-in Status", "Purchase Date"];
    const rows = filteredTickets.map(t => [
      t.id.slice(0, 8).toUpperCase(),
      t.events?.title || "N/A",
      t.profiles?.full_name || "N/A",
      t.profiles?.email || "N/A",
      t.quantity || 1,
      t.status,
      t.check_in_status,
      format(new Date(t.created_at), "yyyy-MM-dd HH:mm"),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tickets-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredTickets.length} tickets to CSV`,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading tickets...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Ticket className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{stats.totalTickets}</div>
                <div className="text-sm text-muted-foreground">Total Tickets</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">£{stats.totalRevenue.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{stats.checkedIn}</div>
                <div className="text-sm text-muted-foreground">Checked In</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold">{stats.pending}</div>
                <div className="text-sm text-muted-foreground">Pending</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ticket Management</CardTitle>
          <CardDescription>View and manage all ticket sales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ticket ID, name, or email..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {events.map(event => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
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
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="checked_in">Checked In</SelectItem>
                <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchTickets}>
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Attendee</TableHead>
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
                  filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-mono text-sm">
                        {ticket.id.slice(0, 8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {ticket.events?.title || "N/A"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.events?.date ? format(new Date(ticket.events.date), "MMM dd") : ""}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{ticket.profiles?.full_name || "N/A"}</div>
                        <div className="text-xs text-muted-foreground">
                          {ticket.profiles?.email || ""}
                        </div>
                      </TableCell>
                      <TableCell>{ticket.quantity || 1}</TableCell>
                      <TableCell>
                        <Badge variant={ticket.status === "confirmed" ? "default" : "secondary"}>
                          {ticket.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ticket.check_in_status === "checked_in" ? (
                          <Badge className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Checked In
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(ticket.created_at), "MMM dd, HH:mm")}
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
    </div>
  );
};