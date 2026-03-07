import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { EventMediaUpload } from "@/components/EventMediaUpload";
import { SEOHead } from "@/components/SEOHead";
import { PaymentComplianceText } from "@/components/PaymentComplianceText";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, Image, Calendar, MapPin, Clock, Heart, Gift, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const eventSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(3, "Location is required"),
  category: z.string().optional(),
  price: z.number().min(0).default(0),
  available_tickets: z.number().min(0).default(0),
  image: z.string().optional(),
  external_url: z.string().optional(),
  ticket_url: z.string().optional(),
  denominations: z.string().optional(),
  duration: z.string().optional(),
  requirements: z.string().optional(),
  registration_type: z.string().default("ticketed"),
  refund_policy: z.string().default("moderate"),
  accept_donations: z.boolean().default(false),
  accept_gift_aid: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventSchema>;

const categories = [
  "Worship Service", "Bible Study", "Prayer Meeting", "Youth Ministry",
  "Children's Ministry", "Community Outreach", "Conference", "Workshop",
  "Concert", "Fellowship", "Retreat", "Fundraising", "Other"
];

export default function EventEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [eventSlug, setEventSlug] = useState<string>("");
  const [hasPaymentAccount, setHasPaymentAccount] = useState<boolean | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      category: "",
      price: 0,
      available_tickets: 0,
      image: "",
      external_url: "",
      ticket_url: "",
      denominations: "",
      duration: "",
      requirements: "",
      registration_type: "ticketed",
      refund_policy: "moderate",
      accept_donations: false,
      accept_gift_aid: false,
    },
  });

  useEffect(() => {
    if (id && user) {
      fetchEvent();
      checkPaymentAccount();
    }
  }, [id, user]);

  const checkPaymentAccount = async () => {
    if (!user) return;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const { data } = await supabase.functions.invoke('check-connect-status', {
        headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
      });
      const hasStripe = data?.has_account && !data?.stripe_account_id?.startsWith('paypal_only_') && data?.account_status === 'active';
      const hasPaypal = !!data?.paypal_email;
      setHasPaymentAccount(hasStripe || hasPaypal);
    } catch {
      setHasPaymentAccount(null);
    }
  };

  const fetchEvent = async () => {
    if (!id || !user) return;
    
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Check if user owns this event
      if (data.created_by !== user.id) {
        toast({
          title: "Access denied",
          description: "You can only edit your own events",
          variant: "destructive",
        });
        navigate("/my-profiles");
        return;
      }

      setEventSlug(data.slug);
      
      // Populate form with existing data
      form.reset({
        title: data.title || "",
        description: data.description || "",
        date: data.date || "",
        time: data.time || "",
        location: data.location || "",
        category: data.category || "",
        price: data.price || 0,
        available_tickets: data.available_tickets || 0,
        image: data.image || "",
        external_url: data.external_url || "",
        ticket_url: data.ticket_url || "",
        denominations: data.denominations || "",
        duration: data.duration || "",
        requirements: data.requirements || "",
        registration_type: data.registration_type || "ticketed",
        refund_policy: (data as any).refund_policy || "moderate",
        accept_donations: (data as any).accept_donations || false,
        accept_gift_aid: (data as any).accept_gift_aid || false,
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({
        title: "Error",
        description: "Failed to load event",
        variant: "destructive",
      });
      navigate("/my-profiles");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!id || !user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          title: data.title,
          description: data.description || null,
          date: data.date,
          time: data.time,
          location: data.location,
          category: data.category || null,
          price: data.price,
          available_tickets: data.available_tickets,
          image: data.image || null,
          external_url: data.external_url || null,
          ticket_url: data.ticket_url || null,
          denominations: data.denominations || null,
          duration: data.duration || null,
          requirements: data.requirements || null,
          registration_type: data.registration_type || "ticketed",
          refund_policy: data.refund_policy || "moderate",
          accept_donations: data.accept_donations || false,
          accept_gift_aid: data.accept_gift_aid || false,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Event updated",
        description: "Your changes have been saved",
      });

      navigate("/my-profiles");
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Please sign in to edit events.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Edit Event | MyEcclesia"
        description="Edit your event details"
        noIndex={true}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/my-profiles")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Edit Event</h1>
            <p className="text-muted-foreground text-sm">Update your event details</p>
          </div>
        </div>

        {/* Payment Account Warning */}
        {hasPaymentAccount === false && (form.watch("registration_type") === "ticketed") && (form.watch("price") > 0) && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your Stripe or PayPal account to receive payments for your event.{' '}
              <a href="/profile/edit" className="underline font-medium">Set up payment account →</a>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Event Image - Prominent placement */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Event Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <EventMediaUpload
                          currentImageUrl={field.value}
                          onImageUrlChange={field.onChange}
                          label="Event Image"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Basic Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your event..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Date, Time & Location */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  When & Where
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 2 hours" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <Input placeholder="Event venue or address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Registration Type & Tickets */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Registration & Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="registration_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select registration type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ticketed">In-Platform Ticketing</SelectItem>
                          <SelectItem value="rsvp">Free RSVP</SelectItem>
                          <SelectItem value="external_ticket">External Ticketing</SelectItem>
                          <SelectItem value="external_page">External Website Page</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {field.value === 'ticketed' && 'Sell tickets directly on MyEcclesia via Stripe.'}
                        {field.value === 'rsvp' && 'Free event — attendees can RSVP with one click.'}
                        {field.value === 'external_ticket' && 'Link to an external ticketing platform.'}
                        {field.value === 'external_page' && 'Link to an external event website.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {(form.watch("registration_type") === "ticketed" || !form.watch("registration_type")) && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (£)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="available_tickets"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Available Tickets</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {(form.watch("registration_type") === "external_ticket") && (
                  <FormField
                    control={form.control}
                    name="ticket_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>External Ticket URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(form.watch("registration_type") === "external_page" || form.watch("registration_type") === "external_ticket") && (
                  <FormField
                    control={form.control}
                    name="external_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Event Website (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="denominations"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Denominations</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Anglican, Baptist, Catholic..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requirements or Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requirements for attendees..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="refund_policy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refund & Cancellation Policy</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="flexible">Flexible</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="strict">Strict</SelectItem>
                          <SelectItem value="donation_based">Donation-Based</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                      {field.value === 'flexible' && 'Full refund up to 24 hours before the event. If the organiser cancels, a full refund will be provided.'}
                      {field.value === 'moderate' && 'Full refund up to 7 days before the event. No refund after that. If the organiser cancels, a full refund will be provided.'}
                      {field.value === 'strict' && 'No refunds after purchase. Ticket transfers may be allowed. If the organiser cancels, a full refund will be provided.'}
                      {field.value === 'donation_based' && 'No refund — ticket purchase is treated as a donation to the organiser. If the organiser cancels, a full refund will be provided.'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Donations & Gift Aid */}
            {form.watch("registration_type") !== "external_ticket" && form.watch("registration_type") !== "external_page" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Donations & Gift Aid
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="accept_donations"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="cursor-pointer">Accept Donations</FormLabel>
                          <FormDescription>
                            Attendees can add a voluntary donation (£2, £5, £10 or custom) when booking. Donations are paid to you via Stripe.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {form.watch("accept_donations") && (
                    <FormField
                      control={form.control}
                      name="accept_gift_aid"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border p-4 ml-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer flex items-center gap-2">
                              <Gift className="h-3 w-3" />
                              Enable Gift Aid Declaration
                            </FormLabel>
                            <FormDescription>
                              Show a Gift Aid checkbox so UK taxpayers can increase their donation by 25% at no extra cost. You are responsible for submitting Gift Aid claims to HMRC.
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Compliance Text */}
            {form.watch("registration_type") === "ticketed" && (
              <PaymentComplianceText />
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => navigate("/my-profiles")}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
