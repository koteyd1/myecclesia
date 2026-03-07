import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Church } from "lucide-react";

export default function Churches() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: churches, isLoading } = useQuery({
    queryKey: ["churches", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("churches")
        .select("*")
        .eq("is_verified", true)
        .order("name", { ascending: true });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,denomination.ilike.%${searchQuery}%,address.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Churches - Find a Church Near You | MyEcclesia"
        description="Discover churches across the UK. Find service times, locations, and connect with a church community near you."
        canonicalUrl="/churches"
        keywords="churches, church finder, UK churches, find a church, Christian churches"
      />

      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Churches</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Find a church community near you
          </p>
        </div>

        {/* Search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, denomination, or location..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : churches && churches.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground mb-6">{churches.length} churches found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {churches.map((church) => (
                <Link key={church.id} to={`/church/${church.slug}`}>
                  <Card className="hover:shadow-lg transition-shadow h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {church.logo_url ? (
                          <img src={church.logo_url} alt={church.name} className="w-16 h-16 rounded-lg object-cover" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Church className="w-8 h-8 text-primary" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1 truncate">{church.name}</h3>
                          {church.denomination && <Badge variant="secondary" className="mb-2">{church.denomination}</Badge>}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{church.address}</span>
                          </div>
                          {church.service_times && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">{church.service_times}</p>
                          )}
                        </div>
                      </div>
                      {church.mission_statement && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{church.mission_statement}</p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Church className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Churches Found</h2>
            <p className="text-muted-foreground">
              {searchQuery ? "Try adjusting your search." : "No verified churches yet."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
