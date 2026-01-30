import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { ImageUpload } from '@/components/ImageUpload';

const denominations = [
  'Anglican', 'Baptist', 'Catholic', 'Methodist', 'Presbyterian', 'Pentecostal',
  'Orthodox', 'Lutheran', 'Evangelical', 'Reformed', 'Congregational',
  'Quaker', 'Salvation Army', 'Adventist', 'Non-denominational', 'Other'
];

const commonServices = [
  'Sunday Worship', 'Bible Study', 'Prayer Meeting', 'Youth Ministry',
  'Children\'s Ministry', 'Food Bank', 'Counselling', 'Community Outreach',
  'Marriage Support', 'Bereavement Support', 'Charity Work', 'Hospital Visits',
  'Prison Ministry', 'Homeless Support', 'Elderly Care', 'Addiction Recovery'
];

const organizationSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  postcode: z.string().min(3, 'Postcode is required'),
  country: z.string().min(2, 'Country is required'),
  denomination: z.string().optional(),
  mission_statement: z.string().optional(),
  services_offered: z.array(z.string()).default([]),
  safeguarding_contact: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  banner_url: z.string().url().optional().or(z.literal('')),
  social_media_links: z.object({
    facebook: z.string().url().optional().or(z.literal('')),
    instagram: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    youtube: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal(''))
  }).default({})
});

type OrganizationFormData = z.infer<typeof organizationSchema>;

export default function OrganizationForm() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newService, setNewService] = useState('');

  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: '',
      address: '',
      postcode: '',
      country: 'United Kingdom',
      denomination: '',
      mission_statement: '',
      services_offered: [],
      safeguarding_contact: '',
      logo_url: '',
      banner_url: '',
      social_media_links: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        website: ''
      }
    }
  });

  const { watch, setValue } = form;
  const servicesOffered = watch('services_offered');

  const addService = (service: string) => {
    if (service && !servicesOffered.includes(service)) {
      setValue('services_offered', [...servicesOffered, service]);
    }
  };

  const removeService = (service: string) => {
    setValue('services_offered', servicesOffered.filter(s => s !== service));
  };

  const addCustomService = () => {
    if (newService.trim()) {
      addService(newService.trim());
      setNewService('');
    }
  };

  const onSubmit = async (data: OrganizationFormData) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create an organization profile",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    // Double-check user is authenticated with Supabase
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.id) {
      toast({
        title: "Session expired",
        description: "Please sign in again to continue",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean up social media links
      const cleanSocialLinks = Object.fromEntries(
        Object.entries(data.social_media_links).filter(([, url]) => url && url.trim() !== '')
      );

      // Generate a temporary slug - will be made unique by database trigger
      const tempSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      
      const { data: organization, error } = await supabase
        .from('organizations')
        .insert({
          user_id: user.id,
          name: data.name,
          address: data.address,
          postcode: data.postcode,
          country: data.country,
          denomination: data.denomination || null,
          mission_statement: data.mission_statement || null,
          services_offered: data.services_offered,
          safeguarding_contact: data.safeguarding_contact || null,
          logo_url: data.logo_url || null,
          banner_url: data.banner_url || null,
          social_media_links: cleanSocialLinks,
          is_verified: false, // Will need admin approval
          slug: tempSlug
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating organization:', error);
        throw error;
      }

      toast({
        title: "Organization profile created",
        description: "Your organization profile has been submitted for review. It will be visible once approved by our team.",
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">Authentication Required</h1>
        <p className="text-muted-foreground mt-2">Please sign in to create an organization profile.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Organization Profile</h1>
        <p className="text-muted-foreground mt-2">
          Create a profile for your faith-based organization. Your profile will be reviewed before going live.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="St. Mary's Church" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="denomination"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Denomination</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select denomination" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {denominations.map((denom) => (
                          <SelectItem key={denom} value={denom}>
                            {denom}
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
                name="mission_statement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mission Statement</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your organization's spiritual and social purpose..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Share your organization's mission, values, and purpose
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 High Street, City Centre"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="postcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postcode *</FormLabel>
                      <FormControl>
                        <Input placeholder="SW1A 1AA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Services & Ministries */}
          <Card>
            <CardHeader>
              <CardTitle>Services & Ministries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">
                  Select the services and ministries your organization offers:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {commonServices.map((service) => (
                    <Button
                      key={service}
                      type="button"
                      variant={servicesOffered.includes(service) ? "default" : "outline"}
                      size="sm"
                      onClick={() => 
                        servicesOffered.includes(service) 
                          ? removeService(service)
                          : addService(service)
                      }
                    >
                      {service}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Add custom service..."
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomService())}
                  />
                  <Button type="button" variant="outline" onClick={addCustomService}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {servicesOffered.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {servicesOffered.map((service) => (
                      <Badge key={service} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-destructive"
                          onClick={() => removeService(service)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo</FormLabel>
                    <FormControl>
                      <ImageUpload
                        currentImageUrl={field.value}
                        onImageUrlChange={field.onChange}
                        label="Upload Logo"
                        placeholder="Logo URL"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload your organization's logo (square format recommended)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="banner_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banner Image</FormLabel>
                    <FormControl>
                      <ImageUpload
                        currentImageUrl={field.value}
                        onImageUrlChange={field.onChange}
                        label="Upload Banner"
                        placeholder="Banner URL"
                      />
                    </FormControl>
                    <FormDescription>
                      Upload a banner image for your profile header (16:9 ratio recommended)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Contact & Social */}
          <Card>
            <CardHeader>
              <CardTitle>Contact & Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="safeguarding_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Safeguarding Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="safeguarding@yourorg.com or contact name" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional: Contact information for safeguarding matters
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="social_media_links.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourorg.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_media_links.facebook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook</FormLabel>
                      <FormControl>
                        <Input placeholder="https://facebook.com/yourorg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_media_links.instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/yourorg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_media_links.twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter/X</FormLabel>
                      <FormControl>
                        <Input placeholder="https://twitter.com/yourorg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="social_media_links.youtube"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>YouTube</FormLabel>
                      <FormControl>
                        <Input placeholder="https://youtube.com/@yourorg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Organization Profile'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}