import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Globe, Calendar, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SEOHead } from '@/components/SEOHead';
import { useCanonical } from '@/hooks/useCanonical';
import { StructuredData, createOrganizationSchema } from '@/components/StructuredData';
import { SocialShare } from '@/components/SocialShare';
import EventCard from '@/components/EventCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { EventManagement } from '@/components/EventManagement';

export default function OrganizationProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [showEventManagement, setShowEventManagement] = useState(false);
  
  useCanonical({ customUrl: `/organization/${slug}` });

  const { data: organization, isLoading } = useQuery({
    queryKey: ['organization', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .eq('is_verified', true)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const { data: events } = useQuery({
    queryKey: ['organization-events', organization?.id],
    queryFn: async () => {
      const isOwner = !!user && !!organization && user.id === organization.user_id;

      let query = supabase
        .from('events')
        .select('*')
        .eq('organization_id', organization.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(6);
      
      // Non-owners should only see approved events
      if (!isOwner) {
        query = query.eq('approval_status', 'approved');
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-64 bg-muted rounded-lg"></div>
          <div className="h-8 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">Organization not found</h1>
        <p className="text-muted-foreground mt-2">The organization you're looking for doesn't exist or isn't verified.</p>
      </div>
    );
  }

  const socialLinks = organization.social_media_links as Record<string, string> || {};
  const currentUrl = `${window.location.origin}/organization/${organization.slug}`;

  // Check if current user is the organization owner
  const isOwner = user && organization && user.id === organization.user_id;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${organization.name} - Faith-Based Organization Profile`}
        description={organization.mission_statement || `Learn about ${organization.name}, a ${organization.denomination || 'faith-based'} organization in ${organization.address}`}
        canonicalUrl={`/organization/${organization.slug}`}
        ogImage={organization.banner_url || organization.logo_url}
        keywords={`${organization.name}, ${organization.denomination}, church, faith, ministry, ${organization.address}`}
      />

      <StructuredData data={createOrganizationSchema()} />

      <main className="min-h-screen bg-background">
        {/* Banner Section */}
        {organization.banner_url && (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={organization.banner_url}
              alt={`${organization.name} banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8">
            <div className="flex-shrink-0">
              {organization.logo_url && (
                <img
                  src={organization.logo_url}
                  alt={`${organization.name} logo`}
                  className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-4 border-background shadow-lg"
                />
              )}
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {organization.name}
                  </h1>
                  
                  {organization.denomination && (
                    <Badge variant="secondary" className="mb-3">
                      {organization.denomination}
                    </Badge>
                  )}

                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{organization.address}, {organization.postcode}, {organization.country}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {isOwner && (
                    <Button
                      onClick={() => setShowEventManagement(!showEventManagement)}
                      variant="secondary"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {showEventManagement ? 'Hide' : 'Manage Events'}
                    </Button>
                  )}
                  
                  <SocialShare
                    url={currentUrl}
                    title={organization.name}
                    description={organization.mission_statement}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Management - Only visible to organization owner */}
              {isOwner && showEventManagement && (
                <EventManagement 
                  organizationId={organization.id}
                  onEventCreated={() => {
                    // Refresh events data
                    window.location.reload();
                  }}
                />
              )}
              {/* Mission Statement */}
              {organization.mission_statement && (
                <Card>
                  <CardHeader>
                    <CardTitle>Our Mission</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {organization.mission_statement}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Services Offered */}
              {organization.services_offered && organization.services_offered.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Services & Ministries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {organization.services_offered.map((service, index) => (
                        <Badge key={index} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Events */}
              {events && events.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-primary" />
                    Upcoming Events & Services
                  </h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {events.map((event) => (
                       <EventCard 
                         key={event.id} 
                         {...event} 
                         availableTickets={event.available_tickets}
                       />
                     ))}
                   </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {organization.address}<br />
                        {organization.postcode}<br />
                        {organization.country}
                      </p>
                    </div>
                  </div>

                  {organization.safeguarding_contact && (
                    <>
                      <Separator />
                      <div className="flex items-start">
                        <Shield className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Safeguarding Contact</p>
                          <p className="text-sm text-muted-foreground">
                            {organization.safeguarding_contact}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Social Media Links */}
              {Object.keys(socialLinks).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect With Us</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

    </div>
  );
}