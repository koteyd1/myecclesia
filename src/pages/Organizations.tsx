import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MapPin, 
  Search, 
  Filter, 
  ChevronDown,
  Building
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";

interface Organization {
  id: string;
  name: string;
  address: string;
  country: string;
  denomination: string | null;
  mission_statement: string | null;
  logo_url: string | null;
  slug: string;
  created_at: string;
}

type SortOption = "newest" | "oldest" | "name";
type ViewMode = "grid" | "list";

export default function Organizations() {
  const { toast } = useToast();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState<string>("all");
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Get unique values for filters
  const denominations = [...new Set(organizations.map(o => o.denomination).filter(Boolean))];
  const countries = [...new Set(organizations.map(o => o.country))];

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    filterAndSortOrganizations();
  }, [organizations, searchTerm, selectedDenomination, selectedCountry, sortBy]);

  const fetchOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("is_verified", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setOrganizations(data || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortOrganizations = () => {
    let filtered = [...organizations];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.denomination && org.denomination.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (org.mission_statement && org.mission_statement.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by denomination
    if (selectedDenomination !== "all") {
      filtered = filtered.filter(org => org.denomination === selectedDenomination);
    }

    // Filter by country
    if (selectedCountry !== "all") {
      filtered = filtered.filter(org => org.country === selectedCountry);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredOrganizations(filtered);
  };

  const OrganizationCard = ({ organization }: { organization: Organization }) => {
    if (viewMode === "list") {
      return (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={organization.logo_url || undefined} />
                <AvatarFallback>
                  {organization.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <Link to={`/organization/${organization.slug}`}>
                  <h3 className="font-semibold text-lg hover:text-primary">
                    {organization.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {organization.address}, {organization.country}
                  </span>
                  {organization.denomination && (
                    <>
                      <span className="text-muted-foreground">•</span>
                      <Badge variant="outline" className="text-xs">
                        {organization.denomination}
                      </Badge>
                    </>
                  )}
                </div>
                
                {organization.mission_statement && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {organization.mission_statement}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={organization.logo_url || undefined} />
            <AvatarFallback>
              {organization.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </CardHeader>
        <CardContent className="pt-0">
          <Link to={`/organization/${organization.slug}`}>
            <h3 className="font-semibold text-lg mb-2 hover:text-primary">
              {organization.name}
            </h3>
          </Link>
          
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {organization.address}, {organization.country}
            </span>
          </div>
          
          {organization.denomination && (
            <Badge variant="outline" className="mb-3">
              {organization.denomination}
            </Badge>
          )}
          
          {organization.mission_statement && (
            <p className="text-sm text-muted-foreground line-clamp-3">
              {organization.mission_statement}
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Browse Organizations | MyEcclesia"
        description="Discover and connect with verified churches and faith-based organizations. Find communities, ministries, and spiritual homes in your area."
        canonicalUrl={`${window.location.origin}/organizations`}
        keywords="churches, organizations, ministries, faith communities, religious institutions"
      />
      
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Organizations Directory",
          "description": "Browse verified churches and faith-based organizations",
          "url": `${window.location.origin}/organizations`
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Organizations</h1>
          <p className="text-muted-foreground">
            Discover and connect with verified churches and faith-based organizations
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations by name, location, or denomination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedDenomination} onValueChange={setSelectedDenomination}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Denomination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Denominations</SelectItem>
                  {denominations.map(denomination => (
                    <SelectItem key={denomination} value={denomination}>
                      {denomination}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="w-4 h-4 mr-2" />
                    Sort by
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("newest")}>
                    Newest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                    Oldest First
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>
                    Name (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-sm text-muted-foreground">
                {filteredOrganizations.length} organization{filteredOrganizations.length !== 1 ? 's' : ''} found
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Organizations Grid/List */}
        {filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Organizations Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedDenomination("all");
              setSelectedCountry("all");
            }}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className={
            viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }>
            {filteredOrganizations.map((organization) => (
              <OrganizationCard key={organization.id} organization={organization} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}