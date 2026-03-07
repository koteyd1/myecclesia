import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Building2, User, Heart, BookOpen, Users, ExternalLink, Share2, Mail, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingStates";
import { SEOHead } from "@/components/SEOHead";
import { SocialShare } from "@/components/SocialShare";
import { format, parseISO } from "date-fns";

interface Opportunity {
  id: string;
  title: string;
  description: string;
  opportunity_type: "job" | "volunteer" | "internship";
  application_method: "external" | "in_app" | "both";
  external_url: string | null;
  location: string;
  is_remote: boolean;
  requirements: string | null;
  responsibilities: string | null;
  salary_range: string | null;
  hours_per_week: string | null;
  deadline: string | null;
  organization_id: string | null;
  minister_id: string | null;
  created_by: string;
  created_at: string;
  organization?: { name: string; logo_url: string | null; slug: string; mission_statement: string | null } | null;
  minister?: { full_name: string; profile_image_url: string | null; slug: string; mission_statement: string | null } | null;
}

const OpportunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          organization:organizations(name, logo_url, slug, mission_statement),
          minister:ministers(full_name, profile_image_url, slug, mission_statement)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setOpportunity(data);
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to load service details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getServiceConfig = (type: string) => {
    switch (type) {
      case "job":
        return {
          icon: <BookOpen className="h-5 w-5" />,
          label: "Professional Service",
          className: "bg-primary/10 text-primary border-primary/20",
        };
      case "volunteer":
        return {
          icon: <Heart className="h-5 w-5" />,
          label: "Community Service",
          className: "bg-secondary/10 text-secondary border-secondary/20",
        };
      case "internship":
        return {
          icon: <Users className="h-5 w-5" />,
          label: "Mentorship",
          className: "bg-accent-foreground/10 text-accent-foreground border-accent-foreground/20",
        };
      default:
        return {
          icon: <Heart className="h-5 w-5" />,
          label: "Service",
          className: "bg-muted text-muted-foreground",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Service not found</h2>
        <Button onClick={() => navigate("/opportunities")}>
          Browse Services
        </Button>
      </div>
    );
  }

  const serviceConfig = getServiceConfig(opportunity.opportunity_type);
  const posterName = opportunity.organization?.name || opportunity.minister?.full_name || "Unknown";
  const posterSlug = opportunity.organization?.slug || opportunity.minister?.slug;
  const posterType = opportunity.organization_id ? "organization" : "minister";
  const posterImage = opportunity.organization?.logo_url || opportunity.minister?.profile_image_url;
  const posterMission = opportunity.organization?.mission_statement || opportunity.minister?.mission_statement;

  const hasExternalLink = opportunity.external_url;
  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <SEOHead
        title={`${opportunity.title} — ${posterName} | MyEcclesia`}
        description={opportunity.description.replace(/<[^>]*>/g, "").substring(0, 160)}
      />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-8">
          <div className="container mx-auto px-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/opportunities")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Services
            </Button>

            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className={`gap-1.5 ${serviceConfig.className}`}>
                  {serviceConfig.icon}
                  {serviceConfig.label}
                </Badge>
                {opportunity.is_remote && (
                  <Badge variant="outline">Remote Available</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-6 tracking-tight">
                {opportunity.title}
              </h1>

              {/* Provider Info — prominent */}
              <Link
                to={`/${posterType}/${posterSlug}`}
                className="inline-flex items-center gap-4 group p-4 -ml-4 rounded-xl hover:bg-card/80 transition-colors"
              >
                {posterImage ? (
                  <img
                    src={posterImage}
                    alt={posterName}
                    className="h-14 w-14 rounded-full object-cover ring-2 ring-border"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center ring-2 ring-border">
                    {opportunity.organization_id ? (
                      <Building2 className="h-7 w-7 text-primary" />
                    ) : (
                      <User className="h-7 w-7 text-primary" />
                    )}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {posterName}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {opportunity.location}
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About this Service */}
              <Card>
                <CardHeader>
                  <CardTitle>About this Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: opportunity.description }}
                  />
                </CardContent>
              </Card>

              {/* What's Included / Responsibilities */}
              {opportunity.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: opportunity.responsibilities }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Who It's For / Requirements */}
              {opportunity.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Who This Is For</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: opportunity.requirements }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* About the Provider */}
              {posterMission && (
                <Card>
                  <CardHeader>
                    <CardTitle>About {posterName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{posterMission}</p>
                    <Link
                      to={`/${posterType}/${posterSlug}`}
                      className="inline-flex items-center gap-2 mt-4 text-primary hover:underline"
                    >
                      View full profile
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{opportunity.location}</p>
                    </div>
                  </div>

                  {opportunity.hours_per_week && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Availability</p>
                        <p className="font-medium">{opportunity.hours_per_week}</p>
                      </div>
                    </div>
                  )}

                  {opportunity.salary_range && (
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Pricing</p>
                        <p className="font-medium">{opportunity.salary_range}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contact / Engage Card */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <h3 className="font-semibold text-foreground mb-2">Get in Touch</h3>

                  {hasExternalLink && (
                    <Button className="w-full gap-2" size="lg" asChild>
                      <a href={opportunity.external_url!} target="_blank" rel="noopener noreferrer">
                        <Globe className="h-4 w-4" />
                        Visit Website
                      </a>
                    </Button>
                  )}

                  <Button
                    variant={hasExternalLink ? "outline" : "default"}
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => navigate(`/${posterType}/${posterSlug}`)}
                  >
                    <User className="h-4 w-4" />
                    View Provider Profile
                  </Button>
                </CardContent>
              </Card>

              {/* Share Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share this Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialShare
                    url={currentUrl}
                    title={opportunity.title}
                    description={`${serviceConfig.label} by ${posterName}`}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OpportunityDetail;
