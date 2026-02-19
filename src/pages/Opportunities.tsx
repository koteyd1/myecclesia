import { useState, useEffect } from "react";
import { Search, MapPin, Building2, User, Heart, BookOpen, Users, Plus } from "lucide-react";
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

const serviceCategories = [
  { value: "all", label: "All Services", icon: null },
  { value: "job", label: "Professional", icon: <BookOpen className="h-4 w-4" /> },
  { value: "volunteer", label: "Community", icon: <Heart className="h-4 w-4" /> },
  { value: "internship", label: "Mentorship", icon: <Users className="h-4 w-4" /> },
];

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

  return (
    <>
      <SEOHead
        title="Faith Based Services | MyEcclesia"
        description="Discover faith-based services from trusted churches, organisations, and kingdom leaders. Find counseling, worship, youth ministry, and more."
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-14 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
                Faith Based Services
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Connect with trusted ministries and organisations offering services to strengthen your faith and community.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search services, providers, or locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-base rounded-full border-border/60 bg-card shadow-sm"
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
              {/* Category Filter Badges */}
              <div className="flex flex-wrap gap-2">
                {serviceCategories.map((cat) => (
                  <Badge
                    key={cat.value}
                    variant={typeFilter === cat.value ? "default" : "outline"}
                    className="cursor-pointer px-4 py-2 text-sm transition-colors hover:bg-primary/10"
                    onClick={() => setTypeFilter(cat.value)}
                  >
                    {cat.icon}
                    <span className={cat.icon ? "ml-1" : ""}>{cat.label}</span>
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
                Promote Service
              </Button>
            )}
          </div>

          {/* Results Count */}
          <p className="text-sm text-muted-foreground mb-6">
            {filteredOpportunities.length} {filteredOpportunities.length === 1 ? "service" : "services"} found
          </p>

          {/* Services Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredOpportunities.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No services found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || typeFilter !== "all" || locationFilter !== "all"
                  ? "Try adjusting your filters or search terms."
                  : "Check back soon for new services."}
              </p>
              {user && (
                <Button onClick={() => navigate("/opportunities/new")}>
                  Promote the first service
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
