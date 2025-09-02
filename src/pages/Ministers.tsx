import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
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
  Heart, 
  Users,
  ChevronDown,
  User
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

interface Minister {
  id: string;
  full_name: string;
  location: string;
  denomination: string | null;
  ministry_focus: string;
  mission_statement: string | null;
  profile_image_url: string | null;
  slug: string;
  created_at: string;
  _count?: {
    minister_followers: number;
  };
}

type SortOption = "newest" | "oldest" | "name" | "followers";
type ViewMode = "grid" | "list";

export default function Ministers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [ministers, setMinisters] = useState<Minister[]>([]);
  const [filteredMinisters, setFilteredMinisters] = useState<Minister[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDenomination, setSelectedDenomination] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [followedMinisters, setFollowedMinisters] = useState<Set<string>>(new Set());

  // Get unique values for filters
  const denominations = [...new Set(ministers.map(m => m.denomination).filter(Boolean))];
  const locations = [...new Set(ministers.map(m => m.location))];

  useEffect(() => {
    fetchMinisters();
    if (user) {
      fetchFollowedMinisters();
    }
  }, [user]);

  useEffect(() => {
    filterAndSortMinisters();
  }, [ministers, searchTerm, selectedDenomination, selectedLocation, sortBy]);

  const fetchMinisters = async () => {
    try {
      const { data, error } = await supabase
        .from("ministers")
        .select(`
          *,
          minister_followers(count)
        `)
        .eq("is_verified", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const ministersWithCounts = data.map(minister => ({
        ...minister,
        _count: {
          minister_followers: minister.minister_followers?.length || 0
        }
      }));

      setMinisters(ministersWithCounts);
    } catch (error) {
      console.error("Error fetching ministers:", error);
      toast({
        title: "Error",
        description: "Failed to load ministers",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFollowedMinisters = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("minister_followers")
        .select("minister_id")
        .eq("user_id", user.id);

      if (error) throw error;
      
      const followedIds = new Set(data.map(f => f.minister_id));
      setFollowedMinisters(followedIds);
    } catch (error) {
      console.error("Error fetching followed ministers:", error);
    }
  };

  const handleFollow = async (ministerId: string) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to follow ministers",
        variant: "destructive",
      });
      return;
    }

    try {
      const isFollowing = followedMinisters.has(ministerId);
      
      if (isFollowing) {
        await supabase
          .from("minister_followers")
          .delete()
          .eq("minister_id", ministerId)
          .eq("user_id", user.id);
        
        setFollowedMinisters(prev => {
          const newSet = new Set(prev);
          newSet.delete(ministerId);
          return newSet;
        });
        
        toast({
          title: "Unfollowed",
          description: "You unfollowed this minister",
        });
      } else {
        await supabase
          .from("minister_followers")
          .insert({
            minister_id: ministerId,
            user_id: user.id,
          });
        
        setFollowedMinisters(prev => new Set([...prev, ministerId]));
        
        toast({
          title: "Following",
          description: "You are now following this minister",
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

  const filterAndSortMinisters = () => {
    let filtered = [...ministers];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(minister =>
        minister.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        minister.ministry_focus.toLowerCase().includes(searchTerm.toLowerCase()) ||
        minister.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (minister.denomination && minister.denomination.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (minister.mission_statement && minister.mission_statement.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by denomination
    if (selectedDenomination !== "all") {
      filtered = filtered.filter(minister => minister.denomination === selectedDenomination);
    }

    // Filter by location
    if (selectedLocation !== "all") {
      filtered = filtered.filter(minister => minister.location === selectedLocation);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.full_name.localeCompare(b.full_name);
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "followers":
          return (b._count?.minister_followers || 0) - (a._count?.minister_followers || 0);
        case "newest":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredMinisters(filtered);
  };

  const MinisterCard = ({ minister }: { minister: Minister }) => {
    const isFollowing = followedMinisters.has(minister.id);
    
    if (viewMode === "list") {
      return (
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={minister.profile_image_url || undefined} />
                <AvatarFallback>
                  {minister.full_name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <Link to={`/minister/${minister.slug}`}>
                      <h3 className="font-semibold text-lg hover:text-primary">
                        {minister.full_name}
                      </h3>
                    </Link>
                    <p className="text-muted-foreground">{minister.ministry_focus}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{minister.location}</span>
                      {minister.denomination && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <Badge variant="outline" className="text-xs">
                            {minister.denomination}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="text-sm font-medium">{minister._count?.minister_followers || 0}</div>
                      <div className="text-xs text-muted-foreground">followers</div>
                    </div>
                    <Button
                      variant={isFollowing ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleFollow(minister.id)}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${isFollowing ? "fill-current" : ""}`} />
                      {isFollowing ? "Following" : "Follow"}
                    </Button>
                  </div>
                </div>
                
                {minister.mission_statement && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {minister.mission_statement}
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
          <div className="flex items-center justify-between">
            <Avatar className="w-16 h-16">
              <AvatarImage src={minister.profile_image_url || undefined} />
              <AvatarFallback>
                {minister.full_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <div className="text-sm font-medium">{minister._count?.minister_followers || 0}</div>
              <div className="text-xs text-muted-foreground">followers</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Link to={`/minister/${minister.slug}`}>
            <h3 className="font-semibold text-lg mb-2 hover:text-primary">
              {minister.full_name}
            </h3>
          </Link>
          
          <p className="text-muted-foreground mb-3">{minister.ministry_focus}</p>
          
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{minister.location}</span>
          </div>
          
          {minister.denomination && (
            <Badge variant="outline" className="mb-3">
              {minister.denomination}
            </Badge>
          )}
          
          {minister.mission_statement && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
              {minister.mission_statement}
            </p>
          )}
          
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            className="w-full"
            onClick={() => handleFollow(minister.id)}
          >
            <Heart className={`w-4 h-4 mr-2 ${isFollowing ? "fill-current" : ""}`} />
            {isFollowing ? "Following" : "Follow"}
          </Button>
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
        title="Browse Ministers | MyEcclesia"
        description="Discover and connect with verified ministers and ministry leaders. Find speakers, mentors, and spiritual guides in your area."
        canonicalUrl={`${window.location.origin}/ministers`}
        keywords="ministers, ministry leaders, speakers, preachers, spiritual guides, church leaders"
      />
      
      <StructuredData
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": "Ministers Directory",
          "description": "Browse verified ministers and ministry leaders",
          "url": `${window.location.origin}/ministers`
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Ministers</h1>
          <p className="text-muted-foreground">
            Discover and connect with verified ministers and ministry leaders
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ministers by name, ministry focus, or location..."
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

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map(location => (
                    <SelectItem key={location} value={location}>
                      {location}
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
                  <DropdownMenuItem onClick={() => setSortBy("followers")}>
                    Most Followers
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <span className="text-sm text-muted-foreground">
                {filteredMinisters.length} minister{filteredMinisters.length !== 1 ? 's' : ''} found
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

        {/* Ministers Grid/List */}
        {filteredMinisters.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Ministers Found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria or filters
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setSelectedDenomination("all");
              setSelectedLocation("all");
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
            {filteredMinisters.map((minister) => (
              <MinisterCard key={minister.id} minister={minister} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}