import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Clock, MapPin, Plus, Ticket, ScanLine, ExternalLink, Globe, TicketCheck, Info, Users } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';
import { TicketTypeManager } from '@/components/TicketTypeManager';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

type RegistrationType = 'in_platform' | 'external_event' | 'external_tickets' | 'rsvp';

const eventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().min(3, 'Location must be at least 3 characters'),
  category: z.string().optional(),
  price: z.number().min(0, 'Price cannot be negative').default(0),
  available_tickets: z.number().min(0, 'Available tickets cannot be negative').default(0),
  image: z.string().url().optional().or(z.literal('')),
  external_url: z.string().url().optional().or(z.literal('')),
  ticket_url: z.string().url().optional().or(z.literal('')),
  denominations: z.string().optional(),
  duration: z.string().optional(),
  requirements: z.string().optional(),
  registration_type: z.enum(['in_platform', 'external_event', 'external_tickets', 'rsvp']).default('in_platform'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface EventManagementProps {
  organizationId?: string;
  ministerId?: string;
  churchId?: string;
  onEventCreated?: () => void;
}

const categories = [
  'Worship Service', 'Bible Study', 'Prayer Meeting', 'Youth Ministry',
  'Children\'s Ministry', 'Community Outreach', 'Conference', 'Workshop',
  'Concert', 'Fellowship', 'Retreat', 'Fundraising', 'Other'
];

export function EventManagement({ organizationId, ministerId, churchId, onEventCreated }: EventManagementProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [userEvents, setUserEvents] = useState<{ id: string; title: string; date: string }[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserEvents();
    }
  }, [user, organizationId, ministerId, churchId]);

  const fetchUserEvents = async () => {
    if (!user) return;
    setLoadingEvents(true);
    try {
      let query = supabase
        .from('events')
        .select('id, title, date')
        .eq('created_by', user.id)
        .order('date', { ascending: false });

      if (organizationId) {
        query = query.eq('organization_id', organizationId);
      } else if (ministerId) {
        query = query.eq('minister_id', ministerId);
      } else if (churchId) {
        query = query.eq('church_id', churchId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setUserEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      category: '',
      price: 0,
      available_tickets: 0,
      image: '',
      external_url: '',
      ticket_url: '',
      denominations: '',
      duration: '',
      requirements: '',
      registration_type: 'in_platform',
    }
  });

  const registrationType = useWatch({ control: form.control, name: 'registration_type' });

  const onSubmit = async (formData: EventFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create events",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        category: formData.category || null,
        price: formData.registration_type === 'rsvp' ? 0 : formData.price,
        available_tickets: formData.available_tickets,
        image: formData.image || null,
        external_url: formData.external_url || null,
        ticket_url: formData.ticket_url || null,
        denominations: formData.denominations || null,
        duration: formData.duration || null,
        requirements: formData.requirements || null,
        registration_type: formData.registration_type === 'rsvp' ? 'rsvp' : 
          formData.registration_type === 'external_tickets' ? 'external_ticket' :
          formData.registration_type === 'external_event' ? 'external_page' : 'ticketed',
        created_by: user.id,
        organization_id: organizationId || null,
        minister_id: ministerId || null,
        church_id: churchId || null,
        slug: '' // Will be auto-generated by trigger
      };

      const { data, error } = await supabase
        .from('events')
        .insert(eventData)
        .select('id')
        .single();

      if (error) throw error;

      const isRsvp = formData.registration_type === 'rsvp';
      toast({
        title: "Event created",
        description: isRsvp 
          ? "Your RSVP event has been created. Attendees can now RSVP from the event page."
          : "Your event has been created successfully. Now add ticket types!",
      });

      // For RSVP events, skip the ticket type manager
      if (isRsvp) {
        form.reset();
        setShowForm(false);
        fetchUserEvents();
        onEventCreated?.();
        return;
      }

      // Set the created event ID to show ticket type manager
      setCreatedEventId(data.id);
      form.reset();
      setShowForm(false);
      fetchUserEvents();
      onEventCreated?.();
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showForm && !createdEventId && !selectedEventId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Event Management
            <div className="flex gap-2">
              <Link to="/scan-tickets">
                <Button variant="outline" size="sm">
                  <ScanLine className="h-4 w-4 mr-2" />
                  Scan Tickets
                </Button>
              </Link>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Create and manage events or services for your {organizationId ? 'organization' : churchId ? 'church' : 'ministry'}.
          </p>
          
          {/* Existing Events with Ticket Management */}
          {userEvents.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Manage Event Tickets
              </h4>
              <div className="grid gap-2">
                {userEvents.slice(0, 5).map((event) => (
                  <Button
                    key={event.id}
                    variant="outline"
                    className="justify-start h-auto py-2"
                    onClick={() => setSelectedEventId(event.id)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-muted-foreground">{event.date}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show ticket type manager for newly created or selected event
  if (createdEventId || selectedEventId) {
    const eventId = createdEventId || selectedEventId!;
    const eventTitle = userEvents.find(e => e.id === eventId)?.title || "New Event";
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              {createdEventId ? "Add Ticket Types" : `Tickets: ${eventTitle}`}
            </span>
            <Button variant="outline" onClick={() => { setCreatedEventId(null); setSelectedEventId(null); }}>
              Back to Events
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TicketTypeManager eventId={eventId} onUpdate={fetchUserEvents} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Create New Event
          <Button variant="outline" onClick={() => setShowForm(false)}>
            Cancel
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Event Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Sunday Morning Service" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
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

              <FormField
                control={form.control}
                name="denominations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Denominations</FormLabel>
                    <FormControl>
                      <Input placeholder="Anglican, Baptist, Catholic..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input placeholder="2 hours" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location and Tickets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location *</FormLabel>
                    <FormControl>
                      <Input placeholder="Church Hall, 123 Main St" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (£)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
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
                          onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Description */}
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

            {/* Requirements */}
            <FormField
              control={form.control}
              name="requirements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Requirements</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special requirements or notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Image</FormLabel>
                  <FormControl>
                    <ImageUpload
                      currentImageUrl={field.value}
                      onImageUrlChange={field.onChange}
                      label="Upload Event Image"
                      placeholder="Event image URL"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Registration Type Selector */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="registration_type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="text-base font-semibold">Registration & Ticketing</FormLabel>
                    <FormDescription>
                      Choose how attendees will register or purchase tickets for your event.
                    </FormDescription>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid gap-3"
                      >
                        <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="in_platform" id="in_platform" className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="in_platform" className="flex items-center gap-2 font-medium cursor-pointer">
                              <TicketCheck className="h-4 w-4 text-primary" />
                              In-Platform Tickets (Free or Paid)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Manage registrations directly on MyEcclesia. Perfect for free events or paid events using Stripe. 
                              You'll be able to add ticket types (e.g., General, VIP) after creating the event.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="external_tickets" id="external_tickets" className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="external_tickets" className="flex items-center gap-2 font-medium cursor-pointer">
                              <Ticket className="h-4 w-4 text-accent-foreground" />
                              External Ticket Provider
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Link to an external ticketing platform (e.g., Eventbrite, Ticketmaster). 
                              Attendees will be redirected to purchase tickets elsewhere.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="rsvp" id="rsvp" className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="rsvp" className="flex items-center gap-2 font-medium cursor-pointer">
                              <Users className="h-4 w-4 text-primary" />
                              RSVP Only (Free)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Simply collect RSVPs to know who's coming. No tickets or payments — just a 
                              headcount and attendee list for your planning.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                          <RadioGroupItem value="external_event" id="external_event" className="mt-1" />
                          <div className="flex-1 space-y-1">
                            <Label htmlFor="external_event" className="flex items-center gap-2 font-medium cursor-pointer">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              External Event Page
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Link to an external website for all event details. The event will display on MyEcclesia 
                              but clicking "View Event" will redirect to your external page.
                            </p>
                          </div>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Conditional URL Fields */}
              {registrationType === 'external_tickets' && (
                <FormField
                  control={form.control}
                  name="ticket_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        Ticket Purchase URL *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://eventbrite.com/your-event" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL where attendees can purchase tickets
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {registrationType === 'external_event' && (
                <FormField
                  control={form.control}
                  name="external_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" />
                        External Event Page URL *
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourchurch.com/revival-night" {...field} />
                      </FormControl>
                      <FormDescription>
                        The URL where attendees will find full event details and registration
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {registrationType === 'rsvp' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Attendees will see an "RSVP" button on your event page. You'll be able to view who has confirmed attendance from your event management dashboard.
                  </AlertDescription>
                </Alert>
              )}

              {registrationType === 'in_platform' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    After creating this event, you'll be able to add ticket types (free or paid) with quantities and pricing.
                    {form.watch('price') === 0 && " Since this is a free event, attendees will be limited to one ticket per person."}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Event"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}