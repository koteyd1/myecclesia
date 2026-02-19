import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Building2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingStates";
import { SEOHead } from "@/components/SEOHead";

interface Organization {
  id: string;
  name: string;
  is_verified: boolean;
}

interface Minister {
  id: string;
  full_name: string;
  is_verified: boolean;
}

const OpportunityForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userMinisters, setUserMinisters] = useState<Minister[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [opportunityType, setOpportunityType] = useState<"job" | "volunteer" | "internship">("volunteer");
  const [applicationMethod, setApplicationMethod] = useState<"external" | "in_app" | "both">("both");
  const [externalUrl, setExternalUrl] = useState("");
  const [location, setLocation] = useState("");
  const [isRemote, setIsRemote] = useState(false);
  const [requirements, setRequirements] = useState("");
  const [responsibilities, setResponsibilities] = useState("");
  const [salaryRange, setSalaryRange] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState("");
  const [deadline, setDeadline] = useState("");
  const [posterType, setPosterType] = useState<"organization" | "minister">("organization");
  const [selectedPosterId, setSelectedPosterId] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchUserProfiles();
  }, [user]);

  useEffect(() => {
    if (id) {
      fetchOpportunity();
    }
  }, [id]);

  const fetchUserProfiles = async () => {
    try {
      // Fetch user's verified organizations
      const { data: orgs, error: orgsError } = await supabase
        .from("organizations")
        .select("id, name, is_verified")
        .eq("user_id", user?.id)
        .eq("is_verified", true);

      if (orgsError) throw orgsError;
      setUserOrganizations(orgs || []);

      // Fetch user's verified minister profiles
      const { data: ministers, error: ministersError } = await supabase
        .from("ministers")
        .select("id, full_name, is_verified")
        .eq("user_id", user?.id)
        .eq("is_verified", true);

      if (ministersError) throw ministersError;
      setUserMinisters(ministers || []);

      // Set default poster if available
      if (orgs && orgs.length > 0) {
        setPosterType("organization");
        setSelectedPosterId(orgs[0].id);
      } else if (ministers && ministers.length > 0) {
        setPosterType("minister");
        setSelectedPosterId(ministers[0].id);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast({
        title: "Error",
        description: "Failed to load your profiles.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchOpportunity = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setTitle(data.title);
      setDescription(data.description);
      setOpportunityType(data.opportunity_type);
      setApplicationMethod(data.application_method);
      setExternalUrl(data.external_url || "");
      setLocation(data.location);
      setIsRemote(data.is_remote || false);
      setRequirements(data.requirements || "");
      setResponsibilities(data.responsibilities || "");
      setSalaryRange(data.salary_range || "");
      setHoursPerWeek(data.hours_per_week || "");
      setDeadline(data.deadline || "");

      if (data.organization_id) {
        setPosterType("organization");
        setSelectedPosterId(data.organization_id);
      } else if (data.minister_id) {
        setPosterType("minister");
        setSelectedPosterId(data.minister_id);
      }
    } catch (error) {
      console.error("Error fetching opportunity:", error);
      toast({
        title: "Error",
        description: "Failed to load opportunity.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPosterId) {
      toast({
        title: "Error",
        description: "Please select an organisation or kingdom leader profile to post as.",
        variant: "destructive",
      });
      return;
    }

    if ((applicationMethod === "external" || applicationMethod === "both") && !externalUrl) {
      toast({
        title: "Error",
        description: "Please provide a website or booking URL.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const opportunityData = {
        title,
        description,
        opportunity_type: opportunityType,
        application_method: applicationMethod,
        external_url: externalUrl || null,
        location,
        is_remote: isRemote,
        requirements: requirements || null,
        responsibilities: responsibilities || null,
        salary_range: salaryRange || null,
        hours_per_week: hoursPerWeek || null,
        deadline: deadline || null,
        organization_id: posterType === "organization" ? selectedPosterId : null,
        minister_id: posterType === "minister" ? selectedPosterId : null,
        created_by: user?.id,
      };

      if (id) {
        const { error } = await supabase
          .from("opportunities")
          .update(opportunityData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service updated successfully!",
        });
      } else {
        const { error } = await supabase.from("opportunities").insert(opportunityData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Service promoted successfully!",
        });
      }

      navigate("/opportunities");
    } catch (error: any) {
      console.error("Error saving opportunity:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save service.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const hasVerifiedProfiles = userOrganizations.length > 0 || userMinisters.length > 0;

  if (!hasVerifiedProfiles) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-lg">
        <SEOHead title="Promote a Service | MyEcclesia" />
        <Building2 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-4">Verification Required</h2>
        <p className="text-muted-foreground mb-6">
          To promote services, you need a verified organisation or kingdom leader profile. Please create and verify your profile first.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate("/organization/new")}>
            Create Organization
          </Button>
          <Button variant="outline" onClick={() => navigate("/minister/new")}>
            Create Kingdom Leader Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead title={id ? "Edit Service | MyEcclesia" : "Promote a Service | MyEcclesia"} />

      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <Button variant="ghost" onClick={() => navigate("/opportunities")} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Services
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{id ? "Edit Service" : "Promote a Service"}</CardTitle>
              <CardDescription>
                {id ? "Update your service listing." : "Showcase a service offered by your organisation or ministry to the community."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Poster Selection */}
                <div className="space-y-4">
                  <Label>Post as</Label>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {userOrganizations.length > 0 && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          posterType === "organization" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          setPosterType("organization");
                          setSelectedPosterId(userOrganizations[0].id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-primary" />
                          <span className="font-medium">Organization</span>
                        </div>
                        {posterType === "organization" && (
                          <Select value={selectedPosterId} onValueChange={setSelectedPosterId}>
                            <SelectTrigger className="mt-3">
                              <SelectValue placeholder="Select organization" />
                            </SelectTrigger>
                            <SelectContent>
                              {userOrganizations.map((org) => (
                                <SelectItem key={org.id} value={org.id}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}

                    {userMinisters.length > 0 && (
                      <div
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                          posterType === "minister" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => {
                          setPosterType("minister");
                          setSelectedPosterId(userMinisters[0].id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-primary" />
                          <span className="font-medium">Kingdom Leader</span>
                        </div>
                        {posterType === "minister" && (
                          <Select value={selectedPosterId} onValueChange={setSelectedPosterId}>
                            <SelectTrigger className="mt-3">
                              <SelectValue placeholder="Select kingdom leader profile" />
                            </SelectTrigger>
                            <SelectContent>
                              {userMinisters.map((minister) => (
                                <SelectItem key={minister.id} value={minister.id}>
                                  {minister.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Service Name *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Marriage Counseling, Youth Worship, Bible Study"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="opportunity-type">Service Category *</Label>
                    <Select value={opportunityType} onValueChange={(v: any) => setOpportunityType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="volunteer">Community Service</SelectItem>
                        <SelectItem value="job">Professional Service</SelectItem>
                        <SelectItem value="internship">Mentorship</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your service, who it helps, and what makes it unique..."
                      className="min-h-[150px]"
                      required
                    />
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g., London, UK"
                      required
                    />
                  </div>

                   <div className="flex items-center space-x-2">
                    <Switch id="remote" checked={isRemote} onCheckedChange={setIsRemote} />
                    <Label htmlFor="remote">Available remotely / online</Label>
                  </div>
                </div>

                {/* Details */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="hours">Availability</Label>
                    <Input
                      id="hours"
                      value={hoursPerWeek}
                      onChange={(e) => setHoursPerWeek(e.target.value)}
                      placeholder="e.g., Weekdays, Saturdays, By appointment"
                    />
                  </div>

                    <div>
                      <Label htmlFor="salary">Pricing (optional)</Label>
                      <Input
                        id="salary"
                        value={salaryRange}
                        onChange={(e) => setSalaryRange(e.target.value)}
                        placeholder="e.g., Free, Donation-based, £50/session"
                      />
                    </div>
                </div>

                {/* Requirements & Responsibilities */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="responsibilities">What's Included</Label>
                    <Textarea
                      id="responsibilities"
                      value={responsibilities}
                      onChange={(e) => setResponsibilities(e.target.value)}
                      placeholder="Describe what people can expect from this service..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div>
                    <Label htmlFor="requirements">Who This Is For</Label>
                    <Textarea
                      id="requirements"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      placeholder="Describe who would benefit from this service..."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                {/* Application Method */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="application-method">Contact Method *</Label>
                    <Select value={applicationMethod} onValueChange={(v: any) => setApplicationMethod(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_app">Through profile only</SelectItem>
                        <SelectItem value="external">External website</SelectItem>
                        <SelectItem value="both">Both options</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(applicationMethod === "external" || applicationMethod === "both") && (
                    <div>
                      <Label htmlFor="external-url">Website / Booking URL *</Label>
                      <Input
                        id="external-url"
                        type="url"
                        value={externalUrl}
                        onChange={(e) => setExternalUrl(e.target.value)}
                        placeholder="https://example.com/book"
                        required={applicationMethod === "external"}
                      />
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/opportunities")}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : id ? "Update Service" : "Promote Service"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default OpportunityForm;
