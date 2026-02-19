import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, Globe, Shield, Clock, Phone, Mail, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventCard from "@/components/EventCard";
import { SocialShare } from "@/components/SocialShare";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { EventManagement } from "@/components/EventManagement";
import { Separator } from "@/components/ui/separator";

interface Church {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  denomination: string | null;
  address: string;
  postcode: string;
  country: string;
  mission_statement: string | null;
  services_offered: string[] | null;
  service_times: string | null;
  pastor_name: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  banner_url: string | null;
  social_media_links: any;
  safeguarding_contact: string | null;
}

export default function ChurchProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [church, setChurch] = useState<Church | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEventManagement, setShowEventManagement] = useState(false);

  useEffect(() => {
    fetchChurchData();
  }, [slug]);

  const fetchChurchData = async () => {
    if (!slug) return;
    try {
      const { data: churchData, error } = await supabase
        .from("churches")
        .select("*")
        .eq("slug", slug)
        .eq("is_verified", true)
        .maybeSingle();

      if (error) throw error;
      if (!churchData) { setIsLoading(false); return; }
      setChurch(churchData);

      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("church_id", churchData.id)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true })
        .limit(6);

      setEvents(eventsData || []);
    } catch (error) {
      console.error("Error fetching church data:", error);
      toast({ title: "Error", description: "Failed to load church profile", variant: "destructive" });
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

  if (!church) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-muted-foreground">Church Not Found</h1>
        <p className="text-muted-foreground mt-2">The church profile you're looking for doesn't exist or isn't verified yet.</p>
        <Link to="/"><Button className="mt-4">Back to Home</Button></Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/church/${church.slug}`;
  const shareDescription = church.mission_statement || `${church.name} - ${church.denomination || 'Church'} in ${church.address}`;
  const isOwner = user && church && user.id === church.user_id;
  const socialLinks = church.social_media_links as Record<string, string> || {};

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={`${church.name} - Church Profile | MyEcclesia`}
        description={shareDescription}
        canonicalUrl={shareUrl}
        ogImage={church.banner_url || church.logo_url}
        keywords={`${church.name}, ${church.denomination}, church, ${church.address}`}
      />
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "Church",
          "name": church.name,
          "description": shareDescription,
          "image": church.logo_url,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": church.address,
            "postalCode": church.postcode,
            "addressCountry": church.country,
          },
          "telephone": church.phone,
          "email": church.email,
          "url": church.website || shareUrl,
        }}
      />

      <main className="min-h-screen bg-background">
        {/* Banner */}
        {church.banner_url ? (
          <div className="relative h-64 md:h-80 overflow-hidden">
            <img src={church.banner_url} alt={`${church.name} banner`} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="relative h-48 md:h-64 bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 -mt-20 relative z-10">
            <div className="flex-shrink-0">
              {church.logo_url && (
                <img src={church.logo_url} alt={`${church.name} logo`} className="w-24 h-24 md:w-32 md:h-32 rounded-lg object-cover border-4 border-background shadow-lg" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{church.name}</h1>
                  {church.denomination && <Badge variant="secondary" className="mb-3">{church.denomination}</Badge>}
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>{church.address}, {church.postcode}, {church.country}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {isOwner && (
                    <Button onClick={() => setShowEventManagement(!showEventManagement)} variant="secondary">
                      <Calendar className="h-4 w-4 mr-2" />
                      {showEventManagement ? 'Hide' : 'Manage Events'}
                    </Button>
                  )}
                  <SocialShare url={shareUrl} title={church.name} description={shareDescription} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {isOwner && showEventManagement && (
                <EventManagement churchId={church.id} onEventCreated={() => window.location.reload()} />
              )}

              {church.mission_statement && (
                <Card>
                  <CardHeader><CardTitle>Our Mission</CardTitle></CardHeader>
                  <CardContent><p className="text-muted-foreground leading-relaxed">{church.mission_statement}</p></CardContent>
                </Card>
              )}

              {church.services_offered && church.services_offered.length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Ministries & Services</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {church.services_offered.map((service, index) => (
                        <Badge key={index} variant="outline">{service}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {events.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <Calendar className="h-6 w-6 mr-2 text-primary" />
                    Upcoming Events & Services
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {events.map((event) => (
                      <EventCard key={event.id} {...event} availableTickets={event.available_tickets} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Service Times */}
              {church.service_times && (
                <Card>
                  <CardHeader><CardTitle>Service Times</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex items-start">
                      <Clock className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{church.service_times}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Contact */}
              <Card>
                <CardHeader><CardTitle>Contact Information</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">{church.address}<br />{church.postcode}<br />{church.country}</p>
                    </div>
                  </div>
                  {church.pastor_name && (
                    <>
                      <Separator />
                      <div>
                        <p className="font-medium">Pastor / Lead Minister</p>
                        <p className="text-sm text-muted-foreground">{church.pastor_name}</p>
                      </div>
                    </>
                  )}
                  {church.phone && (
                    <>
                      <Separator />
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-3 text-muted-foreground" />
                        <a href={`tel:${church.phone}`} className="text-sm text-muted-foreground hover:text-primary">{church.phone}</a>
                      </div>
                    </>
                  )}
                  {church.email && (
                    <>
                      <Separator />
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground" />
                        <a href={`mailto:${church.email}`} className="text-sm text-muted-foreground hover:text-primary">{church.email}</a>
                      </div>
                    </>
                  )}
                  {church.website && (
                    <>
                      <Separator />
                      <div className="flex items-center">
                        <ExternalLink className="h-4 w-4 mr-3 text-muted-foreground" />
                        <a href={church.website} target="_blank" rel="noopener noreferrer" className="text-sm text-muted-foreground hover:text-primary">Website</a>
                      </div>
                    </>
                  )}
                  {church.safeguarding_contact && (
                    <>
                      <Separator />
                      <div className="flex items-start">
                        <Shield className="h-4 w-4 mr-3 mt-1 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Safeguarding Contact</p>
                          <p className="text-sm text-muted-foreground">{church.safeguarding_contact}</p>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Social Media */}
              {Object.keys(socialLinks).length > 0 && (
                <Card>
                  <CardHeader><CardTitle>Connect With Us</CardTitle></CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(socialLinks).map(([platform, url]) => (
                        <a key={platform} href={String(url)} target="_blank" rel="noopener noreferrer" className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
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
