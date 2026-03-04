import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Ticket, Minus, Plus, CreditCard, ShoppingCart, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TicketDonation } from "@/components/TicketDonation";

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
  accept_donations?: boolean;
  accept_gift_aid?: boolean;
}

interface TicketPurchaseProps {
  event: Event;
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
  const [donationAmount, setDonationAmount] = useState(0);
  const [giftAidEnabled, setGiftAidEnabled] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  // Legacy quantity for single-price events
  const [legacyQuantity, setLegacyQuantity] = useState(1);
  // Guest checkout fields
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");

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

  const getGuestInfo = () => {
    if (user) return null;
    if (!guestEmail || !guestEmail.includes("@")) {
      toast({
        title: "Email Required",
        description: "Please enter a valid email address to purchase tickets.",
        variant: "destructive",
      });
      return null;
    }
    return { email: guestEmail, name: guestName || "Guest" };
  };

  const getBuyerInfo = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", user.id)
        .single();
      return {
        email: profile?.email || user.email || "",
        name: profile?.full_name || "Guest",
      };
    }
    const guest = getGuestInfo();
    if (!guest) return null;
    return guest;
  };

  // Handle free ticket for events without ticket types
  const handleFreeTicket = async () => {
    if (!user) {
      navigate("/auth", { state: { from: `/events/${event.slug}` } });
      return;
    }

    setPaymentLoading(true);
    try {
      // If there's a donation, route through paid flow
      if (donationAmount > 0) {
        const buyer = await getBuyerInfo();
        if (!buyer) { setPaymentLoading(false); return; }

        const response = await supabase.functions.invoke("create-ticket-payment", {
          body: {
            eventId: event.slug,
            eventTitle: event.title,
            price: 0,
            quantity: 1,
            buyerEmail: buyer.email,
            buyerName: buyer.name,
            eventDate: event.date,
            eventTime: event.time,
            eventLocation: event.location,
            donationAmount,
            giftAid: giftAidEnabled,
          },
        });

        if (response.error) throw response.error;
        if (response.data?.url) {
          window.location.href = response.data.url;
        }
        return;
      }

      const response = await supabase.functions.invoke("create-free-ticket", {
        body: {
          eventId: event.id,
          eventSlug: event.slug,
          eventTitle: event.title,
          quantity: 1,
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
          giftAid: giftAidEnabled,
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
    const totalTickets = getTotalTickets();
    if (totalTickets === 0) {
      toast({
        title: "No Tickets Selected",
        description: "Please select at least one ticket to purchase.",
        variant: "destructive",
      });
      return;
    }

    const buyer = await getBuyerInfo();
    if (!buyer) return;

    setPaymentLoading(true);
    try {
      const selectedEntries = Object.entries(selectedTickets).filter(([_, qty]) => qty > 0);
      
      if (selectedEntries.length === 1) {
        const [ticketTypeId, quantity] = selectedEntries[0];
        const ticketType = ticketTypes.find(tt => tt.id === ticketTypeId);
        
        if (!ticketType) throw new Error("Ticket type not found");

        // Handle FREE tickets without donation
        if (ticketType.price === 0 && donationAmount === 0) {
          if (!user) {
            navigate("/auth", { state: { from: `/events/${event.slug}` } });
            setPaymentLoading(false);
            return;
          }
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
              giftAid: giftAidEnabled,
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

        // Handle FREE tickets with donation or PAID tickets
        const response = await supabase.functions.invoke("create-ticket-payment", {
          body: {
            eventId: event.slug,
            eventTitle: event.title,
            price: ticketType.price,
            quantity,
            ticketTypeId,
            ticketTypeName: ticketType.name,
            buyerEmail: buyer.email,
            buyerName: buyer.name,
            eventDate: event.date,
            eventTime: event.time,
            eventLocation: event.location,
            donationAmount,
            giftAid: giftAidEnabled,
            isGuest: !user,
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

  const handleLegacyPurchase = async () => {
    const buyer = await getBuyerInfo();
    if (!buyer) return;

    setPaymentLoading(true);
    try {
      const response = await supabase.functions.invoke("create-ticket-payment", {
        body: {
          eventId: event.slug,
          eventTitle: event.title,
          price: event.price,
          quantity: legacyQuantity,
          buyerEmail: buyer.email,
          buyerName: buyer.name,
          eventDate: event.date,
          eventTime: event.time,
          eventLocation: event.location,
          donationAmount,
          giftAid: giftAidEnabled,
          isGuest: !user,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.url) {
        window.location.href = response.data.url;
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

  // Guest checkout form component
  const GuestCheckoutForm = () => {
    if (user) return null;
    return (
      <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Guest Checkout
        </Label>
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Email address *"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
          />
          <Input
            type="text"
            placeholder="Full name (optional)"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Your ticket will be sent to this email. <button className="text-primary underline" onClick={() => navigate("/auth", { state: { from: `/events/${event.slug}` } })}>Sign in</button> to manage tickets in your account.
        </p>
      </div>
    );
  };

  // Quantity selector for legacy events
  const LegacyQuantitySelector = () => (
    <div className="flex items-center justify-center gap-3 mb-4">
      <Label className="text-sm text-muted-foreground">Qty:</Label>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setLegacyQuantity(Math.max(1, legacyQuantity - 1))}
        disabled={legacyQuantity <= 1}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="w-8 text-center font-semibold">{legacyQuantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => setLegacyQuantity(Math.min(10, legacyQuantity + 1))}
        disabled={legacyQuantity >= 10}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );

  // If no ticket types and paid event, show legacy single price purchase
  if (!loading && ticketTypes.length === 0 && event.price > 0) {
    const legacyTotal = event.price * legacyQuantity;

    return (
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Purchase Tickets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                £{event.price.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">per ticket</p>
            </div>
            
            <LegacyQuantitySelector />

            {legacyQuantity > 1 && (
              <div className="text-center text-sm text-muted-foreground">
                {legacyQuantity} tickets × £{event.price.toFixed(2)} = <span className="font-semibold text-foreground">£{legacyTotal.toFixed(2)}</span>
              </div>
            )}

            <GuestCheckoutForm />

            {event.accept_donations && (
              <TicketDonation
                donationAmount={donationAmount}
                giftAidEnabled={giftAidEnabled}
                onDonationChange={setDonationAmount}
                onGiftAidChange={setGiftAidEnabled}
                isFreeEvent={false}
                showDonation={showDonation}
                onShowDonationChange={setShowDonation}
                showGiftAid={event.accept_gift_aid}
              />
            )}

            {donationAmount > 0 && (
              <div className="text-center text-sm">
                <span className="text-muted-foreground">Total: </span>
                <span className="font-bold">£{(legacyTotal + donationAmount).toFixed(2)}</span>
              </div>
            )}

            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handleLegacyPurchase}
              disabled={paymentLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {paymentLoading ? "Processing..." : `Buy ${legacyQuantity > 1 ? `${legacyQuantity} Tickets` : "Ticket"} — £${(legacyTotal + donationAmount).toFixed(2)}`}
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

    // Free ticket - requires sign in
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
              <div className="text-3xl font-bold text-emerald-600 mb-2">Free</div>
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
            <div className="text-3xl font-bold text-emerald-600 mb-2">Free</div>
            <p className="text-sm text-muted-foreground mb-4">This event is free to attend</p>
            
            {event.accept_donations && (
              <TicketDonation
                donationAmount={donationAmount}
                giftAidEnabled={giftAidEnabled}
                onDonationChange={setDonationAmount}
                onGiftAidChange={setGiftAidEnabled}
                isFreeEvent={true}
                showDonation={showDonation}
                onShowDonationChange={setShowDonation}
                showGiftAid={event.accept_gift_aid}
              />
            )}

            <Button
              className="w-full bg-gradient-primary hover:opacity-90 mt-4"
              onClick={handleFreeTicket}
              disabled={paymentLoading}
            >
              <Ticket className="h-4 w-4 mr-2" />
              {paymentLoading ? "Processing..." : donationAmount > 0 ? `Get Ticket + Donate £${donationAmount.toFixed(2)}` : "Get Free Ticket"}
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

        {/* Guest Checkout Form */}
        {totalTickets > 0 && <GuestCheckoutForm />}

        {/* Donation & Gift Aid */}
        {totalTickets > 0 && event.accept_donations && (
          <TicketDonation
            donationAmount={donationAmount}
            giftAidEnabled={giftAidEnabled}
            onDonationChange={setDonationAmount}
            onGiftAidChange={setGiftAidEnabled}
            isFreeEvent={totalAmount === 0}
            showDonation={showDonation}
            onShowDonationChange={setShowDonation}
            showGiftAid={event.accept_gift_aid}
          />
        )}

        {/* Order Summary */}
        {totalTickets > 0 && (
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{totalTickets} ticket{totalTickets > 1 ? "s" : ""}</span>
              </div>
              <div className="text-lg font-semibold">
                {totalAmount === 0 ? "Free" : `£${totalAmount.toFixed(2)}`}
              </div>
            </div>
            {donationAmount > 0 && (
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-muted-foreground">Donation</span>
                <span className="font-medium">£{donationAmount.toFixed(2)}</span>
              </div>
            )}
            {donationAmount > 0 && (
              <div className="flex justify-between items-center mb-4 border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">£{(totalAmount + donationAmount).toFixed(2)}</span>
              </div>
            )}
            {!(donationAmount > 0) && <div className="mb-4" />}
            <Button
              className="w-full bg-gradient-primary hover:opacity-90"
              onClick={handlePurchase}
              disabled={paymentLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {paymentLoading ? "Processing..." : totalAmount === 0 && donationAmount === 0 ? "Get Free Tickets" : `Pay £${(totalAmount + donationAmount).toFixed(2)}`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
