import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Building2, User, Briefcase, Heart, GraduationCap, ExternalLink, Calendar, Share2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingStates";
import { SEOHead } from "@/components/SEOHead";
import { SocialShare } from "@/components/SocialShare";
import { format, isPast, parseISO } from "date-fns";

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
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchOpportunity();
      if (user) {
        checkExistingApplication();
      }
    }
  }, [id, user]);

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
        description: "Failed to load opportunity details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkExistingApplication = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunity_applications")
        .select("id")
        .eq("opportunity_id", id)
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!error && data) {
        setHasApplied(true);
      }
    } catch (error) {
      console.error("Error checking application:", error);
    }
  };

  const handleApply = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase.from("opportunity_applications").insert({
        opportunity_id: id,
        user_id: user.id,
        cover_letter: coverLetter || null,
      });

      if (error) throw error;

      setHasApplied(true);
      setApplyDialogOpen(false);
      toast({
        title: "Application submitted!",
        description: "Your application has been sent successfully.",
      });
    } catch (error: any) {
      console.error("Error applying:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit application.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  const getTypeConfig = (type: string) => {
    switch (type) {
      case "job":
        return {
          icon: <Briefcase className="h-5 w-5" />,
          label: "Job",
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        };
      case "volunteer":
        return {
          icon: <Heart className="h-5 w-5" />,
          label: "Volunteer",
          color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
        };
      case "internship":
        return {
          icon: <GraduationCap className="h-5 w-5" />,
          label: "Internship",
          color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
        };
      default:
        return {
          icon: <Briefcase className="h-5 w-5" />,
          label: "Opportunity",
          color: "bg-gray-100 text-gray-800",
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
        <h2 className="text-2xl font-bold mb-4">Opportunity not found</h2>
        <Button onClick={() => navigate("/opportunities")}>
          Browse Opportunities
        </Button>
      </div>
    );
  }

  const typeConfig = getTypeConfig(opportunity.opportunity_type);
  const posterName = opportunity.organization?.name || opportunity.minister?.full_name || "Unknown";
  const posterSlug = opportunity.organization?.slug || opportunity.minister?.slug;
  const posterType = opportunity.organization_id ? "organization" : "minister";
  const posterImage = opportunity.organization?.logo_url || opportunity.minister?.profile_image_url;
  const posterMission = opportunity.organization?.mission_statement || opportunity.minister?.mission_statement;

  const isDeadlinePassed = opportunity.deadline ? isPast(parseISO(opportunity.deadline)) : false;
  const canApplyInApp = opportunity.application_method === "in_app" || opportunity.application_method === "both";
  const hasExternalLink = opportunity.external_url && (opportunity.application_method === "external" || opportunity.application_method === "both");

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <>
      <SEOHead
        title={`${opportunity.title} | MyEcclesia`}
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
              Back to Opportunities
            </Button>

            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={`${typeConfig.color} gap-1`}>
                  {typeConfig.icon}
                  {typeConfig.label}
                </Badge>
                {opportunity.is_remote && (
                  <Badge variant="outline">Remote</Badge>
                )}
                {isDeadlinePassed && (
                  <Badge variant="destructive">Deadline Passed</Badge>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {opportunity.title}
              </h1>

              {/* Poster Info */}
              <Link
                to={`/${posterType}/${posterSlug}`}
                className="inline-flex items-center gap-3 group"
              >
                {posterImage ? (
                  <img
                    src={posterImage}
                    alt={posterName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    {opportunity.organization_id ? (
                      <Building2 className="h-6 w-6 text-primary" />
                    ) : (
                      <User className="h-6 w-6 text-primary" />
                    )}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {posterName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Posted {format(parseISO(opportunity.created_at), "MMMM d, yyyy")}
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
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About this Opportunity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: opportunity.description }}
                  />
                </CardContent>
              </Card>

              {/* Responsibilities */}
              {opportunity.responsibilities && (
                <Card>
                  <CardHeader>
                    <CardTitle>Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: opportunity.responsibilities }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Requirements */}
              {opportunity.requirements && (
                <Card>
                  <CardHeader>
                    <CardTitle>Requirements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: opportunity.requirements }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* About the Organization/Minister */}
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
                      Learn more about {posterName}
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info Card */}
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
                        <p className="text-sm text-muted-foreground">Hours</p>
                        <p className="font-medium">{opportunity.hours_per_week}</p>
                      </div>
                    </div>
                  )}

                  {opportunity.salary_range && (
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Compensation</p>
                        <p className="font-medium">{opportunity.salary_range}</p>
                      </div>
                    </div>
                  )}

                  {opportunity.deadline && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-sm text-muted-foreground">Application Deadline</p>
                        <p className={`font-medium ${isDeadlinePassed ? "text-destructive" : ""}`}>
                          {format(parseISO(opportunity.deadline), "MMMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Apply Card */}
              <Card>
                <CardContent className="pt-6">
                  {hasApplied ? (
                    <div className="text-center py-4">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <p className="font-semibold text-foreground">Application Submitted</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        You've already applied for this opportunity.
                      </p>
                    </div>
                  ) : isDeadlinePassed ? (
                    <div className="text-center py-4">
                      <p className="font-semibold text-destructive">Deadline Passed</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        This opportunity is no longer accepting applications.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {canApplyInApp && (
                        <Dialog open={applyDialogOpen} onOpenChange={setApplyDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="w-full" size="lg">
                              Apply Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Apply for {opportunity.title}</DialogTitle>
                              <DialogDescription>
                                Submit your application to {posterName}. You can include a cover letter below.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                                <Textarea
                                  id="cover-letter"
                                  placeholder="Tell them why you're interested in this opportunity..."
                                  value={coverLetter}
                                  onChange={(e) => setCoverLetter(e.target.value)}
                                  className="mt-2 min-h-[150px]"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setApplyDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleApply} disabled={applying}>
                                {applying ? "Submitting..." : "Submit Application"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}

                      {hasExternalLink && (
                        <Button
                          variant={canApplyInApp ? "outline" : "default"}
                          className="w-full gap-2"
                          size="lg"
                          asChild
                        >
                          <a href={opportunity.external_url!} target="_blank" rel="noopener noreferrer">
                            Apply on External Site
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Share Card */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share this Opportunity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SocialShare
                    url={currentUrl}
                    title={opportunity.title}
                    description={`${opportunity.opportunity_type} opportunity at ${posterName}`}
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
