import { useState, useEffect } from "react";
import { Search, MapPin, Clock, Building2, User, Briefcase, Heart, GraduationCap, Filter, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import OpportunityCard from "@/components/OpportunityCard";
import { LoadingSpinner } from "@/components/LoadingStates";
import { SEOHead } from "@/components/SEOHead";

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
  salary_range: string | null;
  hours_per_week: string | null;
  deadline: string | null;
  organization_id: string | null;
  minister_id: string | null;
  created_at: string;
  organization?: { name: string; logo_url: string | null; slug: string } | null;
  minister?: { full_name: string; profile_image_url: string | null; slug: string } | null;
}

const Opportunities = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const { data, error } = await supabase
        .from("opportunities")
        .select(`
          *,
          organization:organizations(name, logo_url, slug),
          minister:ministers(full_name, profile_image_url, slug)
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error("Error fetching opportunities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = typeFilter === "all" || opp.opportunity_type === typeFilter;

    const matchesLocation =
      locationFilter === "all" ||
      (locationFilter === "remote" && opp.is_remote) ||
      (locationFilter === "onsite" && !opp.is_remote);

    return matchesSearch && matchesType && matchesLocation;
  });

  const uniqueTypes = ["all", "job", "volunteer", "internship"];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "job":
        return <Briefcase className="h-4 w-4" />;
      case "volunteer":
        return <Heart className="h-4 w-4" />;
      case "internship":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Briefcase className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "job":
        return "Jobs";
      case "volunteer":
        return "Volunteering";
      case "internship":
        return "Internships";
      default:
        return "All";
    }
  };

  return (
    <>
      <SEOHead
        title="Jobs & Volunteering | MyEcclesia"
        description="Find jobs, volunteering opportunities, and internships at churches and Christian organizations. Serve your community with meaningful work."
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Jobs & Volunteering Opportunities
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover meaningful work with churches and Christian organizations. Find jobs, volunteer roles, and internships.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search opportunities by title, description, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Filters & Post Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="flex flex-wrap items-center gap-3">
              {/* Type Filter Badges */}
              <div className="flex flex-wrap gap-2">
                {uniqueTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={typeFilter === type ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-primary/10"
                    onClick={() => setTypeFilter(type)}
                  >
                    {type !== "all" && getTypeIcon(type)}
                    <span className="ml-1">{getTypeLabel(type)}</span>
                  </Badge>
                ))}
              </div>

              {/* Location Filter */}
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[140px]">
                  <MapPin className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {user && (
              <Button onClick={() => navigate("/opportunities/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Post Opportunity
              </Button>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            {filteredOpportunities.length} {filteredOpportunities.length === 1 ? "opportunity" : "opportunities"} found
          </p>

          {/* Opportunities Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No opportunities found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || typeFilter !== "all" || locationFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Check back soon for new opportunities."}
              </p>
              {user && (
                <Button onClick={() => navigate("/opportunities/new")}>
                  Post the first opportunity
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOpportunities.map((opportunity) => (
                <OpportunityCard key={opportunity.id} opportunity={opportunity} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Opportunities;
