import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Calendar, Clock, MapPin, Ticket, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { SEOHead } from "@/components/SEOHead";

interface TicketDetails {
  id: string;
  quantity: number;
  status: string;
  check_in_status: string;
  created_at: string;
  events: {
    id: string;
    title: string;
    date: string;
    time: string;
    location: string;
    image: string;
  };
  ticket_types: {
    name: string;
    price: number;
  } | null;
}

const VerifyTicket = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ticketId) {
      verifyTicket();
    }
  }, [ticketId]);

  const verifyTicket = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from("tickets")
        .select(`
          id,
          quantity,
          status,
          check_in_status,
          created_at,
          events (
            id,
            title,
            date,
            time,
            location,
            image
          ),
          ticket_types (
            name,
            price
          )
        `)
        .eq("id", ticketId)
        .single();

      if (fetchError) throw fetchError;
      
      if (!data) {
        setError("Ticket not found");
        return;
      }

      setTicket(data as unknown as TicketDetails);
    } catch (err) {
      console.error("Error verifying ticket:", err);
      setError("Could not verify ticket. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title="Invalid Ticket | MyEcclesia"
          description="Ticket verification failed"
          noIndex={true}
        />
        <div className="container mx-auto px-4 py-8 max-w-md">
          <Card className="border-2 border-red-500">
            <CardContent className="pt-6 text-center">
              <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Ticket</h1>
              <p className="text-muted-foreground mb-6">
                {error || "This ticket could not be verified."}
              </p>
              <Button onClick={() => navigate("/events")}>
                Browse Events
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const isValid = ticket.status === "confirmed";
  const isCheckedIn = ticket.check_in_status === "checked_in";
  const ticketNumber = ticket.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`Ticket Verification | MyEcclesia`}
        description="Verify event ticket"
        noIndex={true}
      />
      <div className="container mx-auto px-4 py-8 max-w-md">
        <Card className={`border-2 ${
          !isValid ? "border-red-500" :
          isCheckedIn ? "border-yellow-500" :
          "border-green-500"
        }`}>
          {ticket.events?.image && (
            <div className="h-40 overflow-hidden rounded-t-lg">
              <img
                src={ticket.events.image}
                alt={ticket.events.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <CardHeader className="text-center pb-2">
            <div className="mb-4">
              {!isValid ? (
                <XCircle className="h-16 w-16 text-red-600 mx-auto" />
              ) : isCheckedIn ? (
                <AlertCircle className="h-16 w-16 text-yellow-600 mx-auto" />
              ) : (
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
              )}
            </div>
            <CardTitle className={`text-2xl ${
              !isValid ? "text-red-600" :
              isCheckedIn ? "text-yellow-600" :
              "text-green-600"
            }`}>
              {!isValid ? "Invalid Ticket" :
               isCheckedIn ? "Already Checked In" :
               "Valid Ticket"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">{ticket.events?.title}</h2>
              {ticket.ticket_types && (
                <Badge variant="secondary">{ticket.ticket_types.name}</Badge>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{ticket.events?.date ? format(new Date(ticket.events.date), "EEEE, MMMM dd, yyyy") : "TBC"}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-primary" />
                <span>{ticket.events?.time || "TBC"}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span>{ticket.events?.location || "TBC"}</span>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Ticket className="h-5 w-5 text-primary" />
                <span className="font-mono font-bold text-lg">#{ticketNumber}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {ticket.quantity || 1} ticket{(ticket.quantity || 1) > 1 ? "s" : ""}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Purchased {format(new Date(ticket.created_at), "MMM dd, yyyy")}
              </div>
            </div>

            {isValid && !isCheckedIn && (
              <div className="bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center">
                <p className="text-green-700 dark:text-green-400 font-medium">
                  ✓ This ticket is valid for entry
                </p>
              </div>
            )}

            {isCheckedIn && (
              <div className="bg-yellow-100 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                  ⚠ This ticket has already been used
                </p>
              </div>
            )}

            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => navigate(`/events/${ticket.events?.id}`)}
            >
              View Event Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyTicket;