import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Heart, Calendar, ExternalLink, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import EventCard from "@/components/EventCard";
import { SocialShare } from "@/components/SocialShare";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { EventManagement } from "@/components/EventManagement";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [showEventManagement, setShowEventManagement] = useState(false);

  useEffect(() => {
    fetchMinisterData();
  }, [slug]);

  useEffect(() => {
    if (minister && user) {
      checkFollowStatus();
    }
  }, [minister, user]);

  const fetchMinisterData = async () => {
    if (!slug) return;

    try {
      // Fetch minister profile
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

      // Fetch upcoming events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("minister_id", ministerData.id)
        .gte("date", new Date().toISOString().split('T')[0])
        .order("date", { ascending: true })
        .limit(6);

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch followers count
      const { count } = await supabase
        .from("minister_followers")
        .select("*", { count: "exact", head: true })
        .eq("minister_id", ministerData.id);

      setFollowersCount(count || 0);

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

  const checkFollowStatus = async () => {
    if (!minister || !user) return;

    const { data } = await supabase
      .from("minister_followers")
      .select("id")
      .eq("minister_id", minister.id)
      .eq("user_id", user.id)
      .maybeSingle();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!minister || !user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to follow ministers",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isFollowing) {
        await supabase
          .from("minister_followers")
          .delete()
          .eq("minister_id", minister.id)
          .eq("user_id", user.id);
        
        setIsFollowing(false);
        setFollowersCount(prev => Math.max(0, prev - 1));
        toast({
          title: "Unfollowed",
          description: `You unfollowed ${minister.full_name}`,
        });
      } else {
        await supabase
          .from("minister_followers")
          .insert({
            minister_id: minister.id,
            user_id: user.id,
          });
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast({
          title: "Following",
          description: `You are now following ${minister.full_name}`,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-muted rounded-lg"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!minister) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Minister Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The minister profile you're looking for doesn't exist or isn't verified yet.
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/minister/${minister.slug}`;
  const shareTitle = `${minister.full_name} - Ministry Profile`;
  const shareDescription = minister.mission_statement || `${minister.ministry_focus} minister in ${minister.location}`;
  
  // Check if current user is the minister owner
  const isOwner = user && minister && user.id === minister.user_id;

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

      <Header />

      <main>
        {/* Banner Section */}
        <div className="relative h-64 bg-gradient-to-r from-primary to-primary-foreground overflow-hidden">
          {minister.banner_url && (
            <img
              src={minister.banner_url}
              alt={`${minister.full_name} banner`}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Profile Section */}
        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={minister.profile_image_url || undefined} alt={minister.full_name} />
                  <AvatarFallback className="text-2xl">
                    {minister.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-4">
                  <div>
                    <h1 className="text-3xl font-bold">{minister.full_name}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                      <MapPin className="w-4 h-4" />
                      <span>{minister.location}</span>
                      {minister.denomination && (
                        <>
                          <span>•</span>
                          <Badge variant="outline">{minister.denomination}</Badge>
                        </>
                      )}
                    </div>
                    <Badge className="mt-2">{minister.ministry_focus}</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {isOwner && (
                      <Button
                        onClick={() => setShowEventManagement(!showEventManagement)}
                        variant="secondary"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {showEventManagement ? 'Hide' : 'Manage Events'}
                      </Button>
                    )}
                    
                    <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                      <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                    
                    <SocialShare
                      url={shareUrl}
                      title={shareTitle}
                      description={shareDescription}
                    />

                    {/* Social Media Links */}
                    {Object.entries(minister.social_media_links || {}).map(([platform, url]) => (
                      <Button key={platform} variant="outline" size="sm" asChild>
                        <a href={String(url)} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {platform}
                        </a>
                      </Button>
                    ))}
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {followersCount} followers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Event Management - Only visible to minister owner */}
              {isOwner && showEventManagement && (
                <EventManagement 
                  ministerId={minister.id}
                  onEventCreated={() => {
                    // Refresh events data
                    window.location.reload();
                  }}
                />
              )}
              {/* Mission Statement */}
              {minister.mission_statement && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Mission Statement</h2>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{minister.mission_statement}</p>
                  </CardContent>
                </Card>
              )}

              {/* Services Offered */}
              {minister.services_offered && minister.services_offered.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold">Services Offered</h2>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {minister.services_offered.map((service, index) => (
                        <Badge key={index} variant="secondary">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Upcoming Events */}
              {events.length > 0 && (
                <Card>
                  <CardHeader>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Events & Engagements
                    </h2>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {events.map((event) => (
                        <EventCard 
                          key={event.id}
                          {...event}
                          availableTickets={0}
                          denominations=""
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Booking Links */}
              {Object.keys(minister.booking_links).length > 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="font-semibold">Book Services</h3>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {Object.entries(minister.booking_links || {}).map(([service, url]) => (
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

              {/* QR Code for Sharing */}
              <Card>
                <CardHeader>
                  <h3 className="font-semibold">Share Profile</h3>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="p-4 bg-white rounded-lg inline-block">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                      alt="QR Code for profile"
                      className="w-32 h-32"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Scan to view profile
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}