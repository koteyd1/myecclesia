import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, ExternalLink, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventCard from "@/components/EventCard";
import { SocialShare } from "@/components/SocialShare";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { EventManagement } from "@/components/EventManagement";
import { Separator } from "@/components/ui/separator";

interface Minister {
  id: string;
  user_id: string;
  full_name: string;
  location: string;
  denomination: string | null;
  ministry_focus: string;
  mission_statement: string | null;
  services_offered: string[] | null;
  profile_image_url: string | null;
  banner_url: string | null;
  social_media_links: any;
  booking_links: any;
  slug: string;
  created_at: string;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string;
  location: string;
  image: string | null;
  category: string | null;
  price: number | null;
  slug: string;
}

export default function MinisterProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [minister, setMinister] = useState<Minister | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventManagement, setShowEventManagement] = useState(false);

  useEffect(() => {
    fetchMinisterData();
  }, [slug]);

  const fetchMinisterData = async () => {
    if (!slug) return;

    try {
      const { data: ministerData, error: ministerError } = await supabase
        .from("ministers")
        .select("*")
        .eq("slug", slug)
        .eq("is_verified", true)
        .maybeSingle();

      if (ministerError) throw ministerError;
      if (!ministerData) {
        setIsLoading(false);
        return;
      }

      setMinister(ministerData);

      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("minister_id", ministerData.id)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true })
        .limit(6);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

    } catch (error) {
      console.error("Error fetching minister data:", error);
      toast({
        title: "Error",
        description: "Failed to load minister profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!minister) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">Minister Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The minister profile you're looking for doesn't exist or isn't verified yet.
        </p>
        <Link to="/">
          <Button className="mt-4">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/minister/${minister.slug}`;
  const shareTitle = `${minister.full_name} - Ministry Profile`;
  const shareDescription = minister.mission_statement || `${minister.ministry_focus} minister in ${minister.location}`;
  
  const isOwner = user && minister && user.id === minister.user_id;
  const socialLinks = minister.social_media_links as Record<string, string> || {};
  const bookingLinks = minister.booking_links as Record<string, string> || {};

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${minister.full_name} - Ministry Profile | MyEcclesia`}
        description={shareDescription}
        canonicalUrl={shareUrl}
        ogImage={minister.profile_image_url}
        keywords={`${minister.full_name}, ${minister.ministry_focus}, ${minister.denomination}, ministry, ${minister.location}`}
      />
      
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          "name": minister.full_name,
          "description": shareDescription,
          "image": minister.profile_image_url,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": minister.location
          },
          "memberOf": minister.denomination,
          "jobTitle": minister.ministry_focus,
          "url": shareUrl
        }}
      />

      <main className="min-h-screen bg-background">
        {/* Banner Section */}
        {minister.banner_url ? (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img
              src={minister.banner_url}
              alt={`${minister.full_name} banner`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 -mt-20 relative z-10">
            <div className="flex-shrink-0">
              <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-background shadow-lg">
                <AvatarImage src={minister.profile_image_url || undefined} alt={minister.full_name} />
                <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                  {minister.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {minister.full_name}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge>{minister.ministry_focus}</Badge>
                    {minister.denomination && (
                      <Badge variant="secondary">{minister.denomination}</Badge>
                    )}
                  </div>

                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{minister.location}</span>
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
                    url={shareUrl}
                    title={shareTitle}
                    description={shareDescription}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Management - Only visible to minister owner */}
              {isOwner && showEventManagement && (
                <EventManagement 
                  ministerId={minister.id}
                  onEventCreated={() => {
                    window.location.reload();
                  }}
                />
              )}

              {/* Mission Statement */}
              {minister.mission_statement && (
                <Card>
                  <CardHeader>
                    <CardTitle>Mission Statement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">
                      {minister.mission_statement}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Services Offered */}
              {minister.services_offered && minister.services_offered.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Services & Ministries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {minister.services_offered.map((service, index) => (
                        <Badge key={index} variant="outline">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Events */}
              {events.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-primary" />
                    Upcoming Events & Engagements
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => (
                      <EventCard 
                        key={event.id}
                        {...event}
                        availableTickets={0}
                        denominations=""
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Links */}
              {Object.keys(bookingLinks).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Book Services</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(bookingLinks).map(([service, url]) => (
                      <Button key={service} variant="outline" className="w-full justify-start" asChild>
                        <a href={String(url)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {service}
                        </a>
                      </Button>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Contact / Location */}
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{minister.location}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Links */}
              {Object.keys(socialLinks).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Connect</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(socialLinks).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={String(url)}
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
