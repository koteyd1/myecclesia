import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Ticket, Minus, Plus, CreditCard, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TicketType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  quantity_available: number;
  quantity_sold: number;
  max_per_order: number;
  is_active: boolean;
}

interface Event {
  id: string;
  slug: string;
  title: string;
  price: number;
  date: string;
  time: string;
  location: string;
}

interface TicketPurchaseProps {
  event: Event;
}

interface SelectedTicket {
  ticketTypeId: string;
  quantity: number;
  price: number;
  name: string;
}

export const TicketPurchase = ({ event }: TicketPurchaseProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [hasExistingFreeTicket, setHasExistingFreeTicket] = useState(false);

  useEffect(() => {
    fetchTicketTypes();
    if (user) {
      checkExistingFreeTicket();
    }
  }, [event.id, user]);

  const checkExistingFreeTicket = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("id")
        .eq("event_id", event.id)
        .eq("user_id", user.id)
        .neq("status", "cancelled")
        .limit(1);

      if (error) throw error;
      setHasExistingFreeTicket(data && data.length > 0);
    } catch (error) {
      console.error("Error checking existing ticket:", error);
    }
  };

  const fetchTicketTypes = async () => {
    try {
      const { data, error } = await supabase
        .from("ticket_types")
        .select("*")
        .eq("event_id", event.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      setTicketTypes(data || []);
    } catch (error) {
      console.error("Error fetching ticket types:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (ticketTypeId: string, delta: number, max: number, available: number) => {
    setSelectedTickets(prev => {
      const current = prev[ticketTypeId] || 0;
      const newQty = Math.max(0, Math.min(current + delta, max, available));
      if (newQty === 0) {
        const { [ticketTypeId]: removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [ticketTypeId]: newQty };
    });
  };

  const getTotalAmount = () => {
    return ticketTypes.reduce((total, tt) => {
      const qty = selectedTickets[tt.id] || 0;
      return total + (qty * tt.price);
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  // Handle free ticket for events without ticket types
  const handleFreeTicket = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setPaymentLoading(true);
    try {
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
    } catch (error: any) {
      console.error("Error creating free ticket:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to get ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const totalTickets = getTotalTickets();
    if (totalTickets === 0) {
      toast({
        title: "No Tickets Selected",
        description: "Please select at least one ticket to purchase.",
        variant: "destructive",
      });
      return;
    }

    setPaymentLoading(true);
    try {
      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user.id)
        .single();

      const selectedEntries = Object.entries(selectedTickets).filter(([_, qty]) => qty > 0);
      
      if (selectedEntries.length === 1) {
        const [ticketTypeId, quantity] = selectedEntries[0];
        const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId);
        
        if (!ticketType) throw new Error("Ticket type not found");

        // Handle FREE tickets
        if (ticketType.price === 0) {
          const response = await supabase.functions.invoke("create-free-ticket", {
            body: {
              eventId: event.id,
              eventSlug: event.slug,
              eventTitle: event.title,
              quantity,
              ticketTypeId,
              ticketTypeName: ticketType.name,
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
          
          // Navigate to tickets page
          navigate("/my-tickets");
          return;
        }

        // Handle PAID tickets
        const response = await supabase.functions.invoke("create-ticket-payment", {
          body: {
            eventId: event.slug,
            eventTitle: event.title,
            price: ticketType.price,
            quantity,
            ticketTypeId,
            ticketTypeName: ticketType.name,
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
      } else {
        toast({
          title: "Multiple Ticket Types",
          description: "Please select tickets of one type at a time for now.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error creating payment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // If no ticket types and paid event, show legacy single price purchase
  if (!loading && ticketTypes.length === 0 && event.price > 0) {
    // Prompt unauthenticated users to sign in
    if (!user) {
      return (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Purchase Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-primary mb-2">
                £{event.price.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground mb-4">Sign in to purchase tickets</p>
              <Button
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => navigate("/auth", { state: { from: `/events/${event.slug}` } })}
              >
                Sign In to Buy Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Purchase Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-primary mb-2">
              £{event.price.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground mb-4">per ticket</p>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handlePurchase}
              disabled={paymentLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {paymentLoading ? "Processing..." : "Buy Ticket"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  // If no ticket types and FREE event, show free ticket button or "already registered"
  if (ticketTypes.length === 0 && event.price === 0) {
    // User already has a ticket for this free event
    if (hasExistingFreeTicket) {
      return (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Your Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <Badge className="bg-emerald-500 text-white mb-3">Already Registered</Badge>
              <p className="text-sm text-muted-foreground mb-4">
                You already have a ticket for this event
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/my-tickets")}
              >
                <Ticket className="h-4 w-4 mr-2" />
                View My Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    // Prompt unauthenticated users to sign in
    if (!user) {
      return (
        <Card className="border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Get Your Free Ticket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-3xl font-bold text-emerald-600 mb-2">
                Free
              </div>
              <p className="text-sm text-muted-foreground mb-4">Sign in to get your free ticket</p>
              <Button
                className="w-full bg-gradient-primary hover:opacity-90"
                onClick={() => navigate("/auth", { state: { from: `/events/${event.slug}` } })}
              >
                Sign In to Get Ticket
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Get Your Free Ticket
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-3xl font-bold text-emerald-600 mb-2">
              Free
            </div>
            <p className="text-sm text-muted-foreground mb-4">This event is free to attend</p>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleFreeTicket}
              disabled={paymentLoading}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {paymentLoading ? "Processing..." : "Get Free Ticket"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (ticketTypes.length === 0) {
    return null;
  }

  const totalAmount = getTotalAmount();
  const totalTickets = getTotalTickets();

  // Prompt unauthenticated users to sign in for multi-ticket events
  if (!user) {
    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Select Tickets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticketTypes.map((ticketType) => {
            const available = ticketType.quantity_available - ticketType.quantity_sold;
            const isSoldOut = available <= 0;

            return (
              <div
                key={ticketType.id}
                className={`p-4 border rounded-lg ${isSoldOut ? "opacity-50 bg-muted" : "bg-card"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{ticketType.name}</span>
                      {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
                    </div>
                    {ticketType.description && (
                      <p className="text-sm text-muted-foreground mt-1">{ticketType.description}</p>
                    )}
                    <div className="text-lg font-semibold mt-2">
                      {ticketType.price === 0 ? "Free" : `£${ticketType.price.toFixed(2)}`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground text-center mb-4">
              Sign in to select and purchase tickets
            </p>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={() => navigate("/auth", { state: { from: `/events/${event.slug}` } })}
            >
              Sign In to Get Tickets
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" />
          Select Tickets
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {ticketTypes.map((ticketType) => {
          const available = ticketType.quantity_available - ticketType.quantity_sold;
          const isSoldOut = available <= 0;
          const selected = selectedTickets[ticketType.id] || 0;

          return (
            <div
              key={ticketType.id}
              className={`p-4 border rounded-lg ${isSoldOut ? "opacity-50 bg-muted" : "bg-card"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{ticketType.name}</span>
                    {isSoldOut && <Badge variant="destructive">Sold Out</Badge>}
                  </div>
                  {ticketType.description && (
                    <p className="text-sm text-muted-foreground mt-1">{ticketType.description}</p>
                  )}
                  <div className="text-lg font-semibold mt-2">
                    {ticketType.price === 0 ? "Free" : `£${ticketType.price.toFixed(2)}`}
                  </div>
                  {!isSoldOut && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {available} available
                    </p>
                  )}
                </div>
                
                {!isSoldOut && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(ticketType.id, -1, ticketType.max_per_order, available)}
                      disabled={selected === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{selected}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => updateQuantity(ticketType.id, 1, ticketType.max_per_order, available)}
                      disabled={selected >= ticketType.max_per_order || selected >= available}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Order Summary */}
        {totalTickets > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</span>
              </div>
              <div className="text-xl font-bold">
                {totalAmount === 0 ? "Free" : `£${totalAmount.toFixed(2)}`}
              </div>
            </div>
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handlePurchase}
              disabled={paymentLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {paymentLoading ? "Processing..." : totalAmount === 0 ? "Get Free Tickets" : `Pay £${totalAmount.toFixed(2)}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};