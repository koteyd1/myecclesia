import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Search,
  Ticket,
  Users,
  Calendar,
  MapPin,
  Clock,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

interface TicketInfo {
  id: string;
  quantity: number;
  status: string;
  check_in_status: string;
  checked_in_at: string | null;
  created_at: string;
  user_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
  ticket_types?: {
    name: string;
    price: number;
  } | null;
}

interface ScanResult {
  status: "success" | "already_used" | "invalid" | "wrong_event";
  message: string;
  ticket?: TicketInfo;
}

const TicketScanner = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>(eventId || "");
  const [selectedEventDetails, setSelectedEventDetails] = useState<Event | null>(null);
  const [manualTicketId, setManualTicketId] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, checkedIn: 0, remaining: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchUserEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEvent) {
      fetchEventDetails();
      fetchEventStats();
    }
  }, [selectedEvent]);

  const fetchUserEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("id, title, date, time, location")
        .eq("created_by", user?.id)
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
      
      if (eventId && data?.find(e => e.id === eventId)) {
        setSelectedEvent(eventId);
      } else if (data && data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEventDetails = async () => {
    if (!selectedEvent) return;
    
    const event = events.find(e => e.id === selectedEvent);
    setSelectedEventDetails(event || null);
  };

  const fetchEventStats = async () => {
    if (!selectedEvent) return;

    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("id, quantity, check_in_status")
        .eq("event_id", selectedEvent)
        .eq("status", "confirmed");

      if (error) throw error;

      const total = (data || []).reduce((sum, t) => sum + (t.quantity || 1), 0);
      const checkedIn = (data || []).filter(t => t.check_in_status === "checked_in").reduce((sum, t) => sum + (t.quantity || 1), 0);
      
      setStats({
        total,
        checkedIn,
        remaining: total - checkedIn
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const verifyAndCheckIn = async (ticketId: string) => {
    if (!selectedEvent) {
      toast({
        title: "No Event Selected",
        description: "Please select an event first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Fetch ticket with profile info - using service role would require edge function
      const { data: ticket, error } = await supabase
        .from("tickets")
        .select(`
          id,
          quantity,
          status,
          check_in_status,
          checked_in_at,
          created_at,
          user_id,
          event_id,
          ticket_types (
            name,
            price
          )
        `)
        .eq("id", ticketId)
        .single();

      if (error || !ticket) {
        setScanResult({
          status: "invalid",
          message: "Ticket not found. Please check the ticket ID.",
        });
        return;
      }

      // Check if ticket is for the correct event
      if (ticket.event_id !== selectedEvent) {
        setScanResult({
          status: "wrong_event",
          message: "This ticket is for a different event.",
        });
        return;
      }

      // Check if ticket is confirmed
      if (ticket.status !== "confirmed") {
        setScanResult({
          status: "invalid",
          message: `Ticket status: ${ticket.status}. Cannot check in.`,
        });
        return;
      }

      // Check if already checked in
      if (ticket.check_in_status === "checked_in") {
        setScanResult({
          status: "already_used",
          message: `This ticket was already checked in at ${ticket.checked_in_at ? format(new Date(ticket.checked_in_at), "h:mm a") : "earlier"}.`,
          ticket: ticket as TicketInfo,
        });
        return;
      }

      // Check in the ticket
      const { error: updateError } = await supabase
        .from("tickets")
        .update({
          check_in_status: "checked_in",
          checked_in_at: new Date().toISOString(),
          checked_in_by: user?.id,
        })
        .eq("id", ticketId);

      if (updateError) throw updateError;

      setScanResult({
        status: "success",
        message: `Successfully checked in ${ticket.quantity || 1} ticket(s)!`,
        ticket: { ...ticket, check_in_status: "checked_in" } as TicketInfo,
      });

      // Refresh stats
      fetchEventStats();

      toast({
        title: "Check-in Successful! ✓",
        description: `${ticket.quantity || 1} ticket(s) checked in`,
      });
    } catch (error) {
      console.error("Error verifying ticket:", error);
      setScanResult({
        status: "invalid",
        message: "An error occurred while verifying the ticket.",
      });
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTicketId.trim()) {
      // Try to parse as JSON (QR code data) or use as ticket ID
      let ticketId = manualTicketId.trim();
      try {
        const parsed = JSON.parse(ticketId);
        ticketId = parsed.ticketId || ticketId;
      } catch {
        // Not JSON, use as-is
      }
      verifyAndCheckIn(ticketId);
      setManualTicketId("");
    }
  };

  const startCamera = async () => {
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        scanQRCode();
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please use manual entry.",
        variant: "destructive",
      });
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    setIsScanning(false);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const scanQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      // Here we would use a QR code library like jsQR
      // For now, we'll just provide manual entry
    }

    requestAnimationFrame(scanQRCode);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading scanner...</div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEOHead
          title="Ticket Scanner | MyEcclesia"
          description="Scan and verify event tickets"
          noIndex={true}
        />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground mb-6">
                You don't have any upcoming events to scan tickets for.
              </p>
              <Button onClick={() => navigate("/my-profiles")}>
                Create an Event
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Ticket Scanner | MyEcclesia"
        description="Scan and verify event tickets for check-in"
        noIndex={true}
      />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Camera className="h-8 w-8 text-primary" />
            Ticket Scanner
          </h1>
          <p className="text-muted-foreground">Verify and check-in tickets for your events</p>
        </div>

        {/* Event Selector */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Select Event</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title} - {format(new Date(event.date), "MMM dd")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEventDetails && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{format(new Date(selectedEventDetails.date), "EEEE, MMMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{selectedEventDetails.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{selectedEventDetails.location}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats */}
        {selectedEvent && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 text-center">
                <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total Tickets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
                <div className="text-xs text-muted-foreground">Checked In</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <Ticket className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{stats.remaining}</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Scanner */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Scan or Enter Ticket</CardTitle>
            <CardDescription>
              Use the camera to scan a QR code or enter the ticket ID manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Camera View */}
            {isScanning && (
              <div className="relative aspect-square bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-primary/50 m-8 rounded-lg" />
              </div>
            )}

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startCamera} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={stopCamera} variant="outline" className="flex-1">
                  Stop Camera
                </Button>
              )}
              <Button variant="outline" onClick={fetchEventStats}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
              </div>
            </div>

            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <Input
                placeholder="Enter ticket ID or paste QR data"
                value={manualTicketId}
                onChange={(e) => setManualTicketId(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!manualTicketId.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Verify
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Scan Result */}
        {scanResult && (
          <Card className={`border-2 ${
            scanResult.status === "success" ? "border-green-500 bg-green-50 dark:bg-green-950/20" :
            scanResult.status === "already_used" ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20" :
            "border-red-500 bg-red-50 dark:bg-red-950/20"
          }`}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {scanResult.status === "success" ? (
                  <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                ) : scanResult.status === "already_used" ? (
                  <AlertCircle className="h-8 w-8 text-yellow-600 flex-shrink-0" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <h3 className={`font-semibold text-lg ${
                    scanResult.status === "success" ? "text-green-700 dark:text-green-400" :
                    scanResult.status === "already_used" ? "text-yellow-700 dark:text-yellow-400" :
                    "text-red-700 dark:text-red-400"
                  }`}>
                    {scanResult.status === "success" ? "Check-in Successful!" :
                     scanResult.status === "already_used" ? "Already Checked In" :
                     "Invalid Ticket"}
                  </h3>
                  <p className="text-muted-foreground mt-1">{scanResult.message}</p>
                  
                  {scanResult.ticket && (
                    <div className="mt-4 p-3 bg-background rounded-lg">
                      {scanResult.ticket.ticket_types && (
                        <Badge variant="secondary" className="mb-2">
                          {scanResult.ticket.ticket_types.name}
                        </Badge>
                      )}
                      <div className="text-sm space-y-1">
                        <div>Quantity: {scanResult.ticket.quantity || 1} ticket(s)</div>
                        <div className="text-xs text-muted-foreground">
                          Ticket ID: {scanResult.ticket.id.slice(0, 8).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setScanResult(null)}
              >
                Scan Another Ticket
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TicketScanner;