import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Plus, Search, Globe, Lock } from "lucide-react";
import { ImageUpload } from "@/components/ImageUpload";

interface Group {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_public: boolean;
  member_count: number;
  created_at: string;
  created_by: string;
}

const Community = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    image_url: "",
    is_public: true
  });

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("member_count", { ascending: false });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error("Error fetching groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to create a group", variant: "destructive" });
      return;
    }

    if (!newGroup.name.trim()) {
      toast({ title: "Name required", description: "Please enter a group name", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from("groups")
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          image_url: newGroup.image_url,
          is_public: newGroup.is_public,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as member with admin role
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: "admin"
        });

      if (memberError) throw memberError;

      toast({ title: "Group created!", description: "Your group has been created successfully" });
      setShowCreateDialog(false);
      setNewGroup({ name: "", description: "", image_url: "", is_public: true });
      navigate(`/community/${groupData.id}`);
    } catch (error: any) {
      console.error("Error creating group:", error);
      toast({ title: "Error", description: error.message || "Failed to create group", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SEOHead 
        title="Community - myEcclesia"
        description="Join faith-based groups, discuss events, and connect with the Christian community on myEcclesia."
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Community Groups</h1>
              <p className="text-muted-foreground">
                Join groups to discuss faith, share events, and connect with others
              </p>
            </div>
            
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create a New Group</DialogTitle>
                  <DialogDescription>
                    Start a community around shared interests and faith
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name *</Label>
                    <Input
                      id="group-name"
                      placeholder="e.g., Young Adults Bible Study"
                      value={newGroup.name}
                      onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-desc">Description</Label>
                    <Textarea
                      id="group-desc"
                      placeholder="What is this group about?"
                      value={newGroup.description}
                      onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cover Image</Label>
                    <ImageUpload
                      currentImageUrl={newGroup.image_url}
                      onImageUrlChange={(url) => setNewGroup({ ...newGroup, image_url: url })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is-public"
                      checked={newGroup.is_public}
                      onChange={(e) => setNewGroup({ ...newGroup, is_public: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="is-public" className="flex items-center gap-2">
                      {newGroup.is_public ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      {newGroup.is_public ? "Public group" : "Private group"}
                    </Label>
                  </div>
                  <Button onClick={createGroup} disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Group"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Groups Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Groups Found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? "Try a different search term" : "Be the first to create a community group!"}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Group
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <Card 
                  key={group.id} 
                  className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => navigate(`/community/${group.id}`)}
                >
                  <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                    {group.image_url && (
                      <img 
                        src={group.image_url} 
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <Badge 
                      variant={group.is_public ? "secondary" : "outline"}
                      className="absolute top-3 right-3"
                    >
                      {group.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {group.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{group.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {group.description || "No description"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count} member{group.member_count !== 1 ? "s" : ""}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Community;
