import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Ticket, QrCode, Download } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import QRCode from "qrcode";

interface UserTicket {
  id: string;
  event_id: string;
  quantity: number;
  status: string;
  check_in_status: string;
  created_at: string;
  payment_metadata: {
    amount_total?: number;
    currency?: string;
    quantity?: number;
  } | null;
  events: {
    id: string;
    slug: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
  };
  ticket_types: {
    id: string;
    name: string;
    price: number;
  } | null;
}

const MyTickets = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserTickets();
    }
  }, [user]);

  const fetchUserTickets = async () => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          id,
          event_id,
          quantity,
          status,
          check_in_status,
          created_at,
          payment_metadata,
          events (
            id,
            slug,
            title,
            date,
            time,
            location,
            image
          ),
          ticket_types (
            id,
            name,
            price
          )
        `)
        .eq("user_id", user?.id)
        .eq("status", "confirmed")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type assertion for the data
      const ticketData = (data || []) as unknown as UserTicket[];
      setTickets(ticketData);

      // Generate QR codes for each ticket
      const codes: Record<string, string> = {};
      for (const ticket of ticketData) {
        const qrData = JSON.stringify({
          ticketId: ticket.id,
          eventId: ticket.event_id,
          eventTitle: ticket.events?.title,
          quantity: ticket.quantity || (ticket.payment_metadata?.quantity || 1),
          verifyUrl: `${window.location.origin}/verify-ticket/${ticket.id}`
        });
        try {
          codes[ticket.id] = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#1e40af',
              light: '#ffffff'
            }
          });
        } catch (err) {
          console.error("Error generating QR code:", err);
        }
      }
      setQrCodes(codes);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast({
        title: "Error",
        description: "Failed to load your tickets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = (ticketId: string, eventTitle: string) => {
    const qrCode = qrCodes[ticketId];
    if (!qrCode) return;

    const link = document.createElement("a");
    link.download = `ticket-${eventTitle.replace(/[^a-z0-9]/gi, "_")}-${ticketId.slice(0, 8)}.png`;
    link.href = qrCode;
    link.click();
  };

  const isUpcoming = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDate >= today;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading your tickets...</div>
        </div>
      </div>
    );
  }

  const upcomingTickets = tickets.filter(t => t.events && isUpcoming(t.events.date));
  const pastTickets = tickets.filter(t => t.events && !isUpcoming(t.events.date));

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="My Tickets | MyEcclesia"
        description="View and manage your event tickets. Access QR codes for event check-in."
        noIndex={true}
      />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Ticket className="h-8 w-8 text-primary" />
            My Tickets
          </h1>
          <p className="text-muted-foreground">View and manage your event tickets</p>
        </div>

        {tickets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Tickets Yet</h3>
              <p className="text-muted-foreground mb-6">
                You haven't purchased any tickets yet. Browse our events to find something you'll love!
              </p>
              <Button onClick={() => navigate("/events")}>
                Browse Events
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Upcoming Tickets */}
            {upcomingTickets.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Events ({upcomingTickets.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      qrCode={qrCodes[ticket.id]}
                      onDownload={downloadQRCode}
                      onViewEvent={() => navigate(`/events/${ticket.events?.slug}`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Past Tickets */}
            {pastTickets.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">
                  Past Events ({pastTickets.length})
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      qrCode={qrCodes[ticket.id]}
                      onDownload={downloadQRCode}
                      onViewEvent={() => navigate(`/events/${ticket.events?.slug}`)}
                      isPast
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface TicketCardProps {
  ticket: UserTicket;
  qrCode?: string;
  onDownload: (ticketId: string, eventTitle: string) => void;
  onViewEvent: () => void;
  isPast?: boolean;
}

const TicketCard = ({ ticket, qrCode, onDownload, onViewEvent, isPast }: TicketCardProps) => {
  const ticketQuantity = ticket.quantity || (ticket.payment_metadata?.quantity || 1);
  const ticketNumber = ticket.id.slice(0, 8).toUpperCase();

  return (
    <Card className={`overflow-hidden ${isPast ? "opacity-75" : ""}`}>
      {ticket.events?.image && (
        <div className="h-32 overflow-hidden">
          <img
            src={ticket.events.image}
            alt={ticket.events.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg line-clamp-2">{ticket.events?.title}</CardTitle>
          <Badge 
            variant={ticket.check_in_status === "checked_in" ? "default" : "secondary"}
            className={ticket.check_in_status === "checked_in" ? "bg-green-600" : ""}
          >
            {ticket.check_in_status === "checked_in" ? "Checked In" : "Valid"}
          </Badge>
        </div>
        {ticket.ticket_types && (
          <Badge variant="outline" className="w-fit mt-1">
            {ticket.ticket_types.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{ticket.events?.date ? format(new Date(ticket.events.date), "MMM dd, yyyy") : "TBC"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{ticket.events?.time || "TBC"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{ticket.events?.location || "TBC"}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Ticket #{ticketNumber}</span>
          <Badge variant="secondary">{ticketQuantity} ticket{ticketQuantity > 1 ? "s" : ""}</Badge>
        </div>

        {/* QR Code */}
        {qrCode && !isPast && (
          <div className="bg-muted/50 rounded-lg p-4 flex flex-col items-center">
            <img src={qrCode} alt="Ticket QR Code" className="w-32 h-32" />
            <p className="text-xs text-muted-foreground mt-2">Scan at check-in</p>
          </div>
        )}

        <div className="flex gap-2">
          {!isPast && qrCode && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onDownload(ticket.id, ticket.events?.title || "event")}
            >
              <Download className="h-4 w-4 mr-2" />
              Download QR
            </Button>
          )}
          <Button
            variant={isPast ? "outline" : "default"}
            size="sm"
            className="flex-1"
            onClick={onViewEvent}
          >
            View Event
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Purchased {format(new Date(ticket.created_at), "MMM dd, yyyy")}
        </div>
      </CardContent>
    </Card>
  );
};

export default MyTickets;