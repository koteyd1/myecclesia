import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Edit, 
  Eye, 
  Users, 
  User, 
  CheckCircle, 
  Clock,
  Settings
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";

interface Profile {
  full_name?: string;
  email?: string;
  phone?: string;
  profile_image_url?: string;
}

interface Minister {
  id: string;
  full_name: string;
  location: string;
  denomination: string | null;
  ministry_focus: string;
  is_verified: boolean;
  slug: string;
  profile_image_url: string | null;
  created_at: string;
}

interface Organization {
  id: string;
  name: string;
  address: string;
  country: string;
  denomination: string | null;
  is_verified: boolean;
  slug: string;
  logo_url: string | null;
  created_at: string;
}

export default function MyProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [minister, setMinister] = useState<Minister | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setProfile(profileData);

      // Fetch minister profile
      const { data: ministerData } = await supabase
        .from("ministers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setMinister(ministerData);

      // Fetch organization profile
      const { data: orgData } = await supabase
        .from("organizations")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      setOrganization(orgData);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-muted-foreground mb-4">
            You need to sign in to view your profiles.
          </p>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (isVerified: boolean) => (
    <Badge variant={isVerified ? "default" : "secondary"} className="ml-2">
      {isVerified ? (
        <>
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </>
      ) : (
        <>
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </>
      )}
    </Badge>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="My Profiles | MyEcclesia"
        description="Manage your minister and organization profiles"
        canonicalUrl={`${window.location.origin}/my-profiles`}
      />

      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profiles</h1>
          <p className="text-muted-foreground">
            Manage your personal, minister, and organization profiles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Personal Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Personal Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={profile?.profile_image_url} />
                  <AvatarFallback>
                    {profile?.full_name?.split(' ').map(n => n[0]).join('') || user.email?.[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{profile?.full_name || "No name set"}</h3>
                  <p className="text-sm text-muted-foreground">{profile?.email || user.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm"><strong>Email:</strong> {profile?.email || user.email}</p>
                {profile?.phone && (
                  <p className="text-sm"><strong>Phone:</strong> {profile.phone}</p>
                )}
              </div>

              <Link to="/profile/edit">
                <Button variant="outline" className="w-full">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Minister Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Minister Profile
                {minister && getStatusBadge(minister.is_verified)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {minister ? (
                <>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={minister.profile_image_url || undefined} />
                      <AvatarFallback>
                        {minister.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{minister.full_name}</h3>
                      <p className="text-sm text-muted-foreground">{minister.ministry_focus}</p>
                      <p className="text-xs text-muted-foreground">{minister.location}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {minister.denomination && (
                      <Badge variant="outline">{minister.denomination}</Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(minister.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {minister.is_verified && (
                      <Link to={`/minister/${minister.slug}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    )}
                    <Link to={`/minister/edit/${minister.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Minister Profile</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a minister profile to showcase your ministry and connect with others.
                  </p>
                  <Link to="/minister/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Minister Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Organization Profile
                {organization && getStatusBadge(organization.is_verified)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {organization ? (
                <>
                  <div className="flex items-center space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={organization.logo_url || undefined} />
                      <AvatarFallback>
                        {organization.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold">{organization.name}</h3>
                      <p className="text-sm text-muted-foreground">{organization.address}</p>
                      <p className="text-xs text-muted-foreground">{organization.country}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {organization.denomination && (
                      <Badge variant="outline">{organization.denomination}</Badge>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(organization.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {organization.is_verified && (
                      <Link to={`/organization/${organization.slug}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    )}
                    <Link to={`/organization/edit/${organization.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">No Organization Profile</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an organization profile to represent your church or ministry.
                  </p>
                  <Link to="/organization/new">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Organization Profile
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        {(minister || organization) && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">
                    {(minister ? 1 : 0) + (organization ? 1 : 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Active Profiles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {(minister?.is_verified ? 1 : 0) + (organization?.is_verified ? 1 : 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Verified Profiles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">
                    {(!minister?.is_verified && minister ? 1 : 0) + (!organization?.is_verified && organization ? 1 : 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending Verification</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}