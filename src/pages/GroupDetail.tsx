import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Globe, Lock, Heart, MessageCircle, Send, Calendar, MapPin, Share2 } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Group {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_public: boolean;
  member_count: number;
  created_by: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  profile_image_url: string | null;
}

interface Post {
  id: string;
  content: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user_id: string;
  event_id: string | null;
  profile?: Profile;
  event?: { id: string; title: string; date: string; location: string; slug: string };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: Profile;
}

const GroupDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (id) {
      fetchGroup();
      fetchPosts();
      fetchEvents();
      if (user) {
        checkMembership();
        fetchUserLikes();
      }
    }
  }, [id, user]);

  const fetchProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    const uniqueIds = [...new Set(userIds)];
    const { data } = await supabase
      .from("profiles")
      .select("user_id, full_name, profile_image_url")
      .in("user_id", uniqueIds);
    
    if (data) {
      const profileMap: Record<string, Profile> = {};
      data.forEach(p => { profileMap[p.user_id] = p; });
      setProfiles(prev => ({ ...prev, ...profileMap }));
    }
  };

  const fetchGroup = async () => {
    try {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setGroup(data);
    } catch (error) {
      console.error("Error fetching group:", error);
      navigate("/community");
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from("group_posts")
        .select("*")
        .eq("group_id", id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const postsWithEvents: Post[] = [];
      const userIds: string[] = [];
      
      for (const post of postsData || []) {
        userIds.push(post.user_id);
        let event = undefined;
        
        if (post.event_id) {
          const { data: eventData } = await supabase
            .from("events")
            .select("id, title, date, location, slug")
            .eq("id", post.event_id)
            .eq("approval_status", "approved")
            .single();
          event = eventData || undefined;
        }
        
        postsWithEvents.push({ ...post, event });
      }
      
      setPosts(postsWithEvents);
      await fetchProfiles(userIds);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data } = await supabase
        .from("events")
        .select("id, title, date")
        .eq("approval_status", "approved")
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(20);
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    }
  };

  const checkMembership = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("group_members")
      .select("id")
      .eq("group_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    setIsMember(!!data);
  };

  const fetchUserLikes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("group_post_likes")
      .select("post_id")
      .eq("user_id", user.id);
    setLikedPosts(new Set(data?.map(l => l.post_id) || []));
  };

  const joinGroup = async () => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    setJoining(true);
    try {
      const { error } = await supabase
        .from("group_members")
        .insert({ group_id: id, user_id: user.id });
      if (error) throw error;
      setIsMember(true);
      toast({ title: "Joined group!" });
      fetchGroup();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setJoining(false);
    }
  };

  const leaveGroup = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", id)
        .eq("user_id", user.id);
      if (error) throw error;
      setIsMember(false);
      toast({ title: "Left group" });
      fetchGroup();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const createPost = async () => {
    if (!user || !newPost.trim()) return;
    setPosting(true);
    try {
      const { error } = await supabase.from("group_posts").insert({
        group_id: id,
        user_id: user.id,
        content: newPost,
        event_id: selectedEvent || null
      });
      if (error) throw error;
      setNewPost("");
      setSelectedEvent("");
      setShowEventPicker(false);
      fetchPosts();
      toast({ title: "Posted!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    if (!user) {
      toast({ title: "Please sign in", variant: "destructive" });
      return;
    }
    const isLiked = likedPosts.has(postId);
    try {
      if (isLiked) {
        await supabase.from("group_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
        setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      } else {
        await supabase.from("group_post_likes").insert({ post_id: postId, user_id: user.id });
        setLikedPosts(prev => new Set(prev).add(postId));
      }
      fetchPosts();
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from("group_post_comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    
    if (data) {
      const userIds = data.map(c => c.user_id);
      await fetchProfiles(userIds);
      setComments(prev => ({ ...prev, [postId]: data }));
    }
  };

  const toggleComments = (postId: string) => {
    if (expandedComments.has(postId)) {
      setExpandedComments(prev => { const n = new Set(prev); n.delete(postId); return n; });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      if (!comments[postId]) loadComments(postId);
    }
  };

  const addComment = async (postId: string) => {
    if (!user || !newComments[postId]?.trim()) return;
    try {
      await supabase.from("group_post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content: newComments[postId]
      });
      setNewComments(prev => ({ ...prev, [postId]: "" }));
      loadComments(postId);
      fetchPosts();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-48 w-full rounded-lg mb-6" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (!group) return null;

  return (
    <>
      <SEOHead title={`${group.name} - myEcclesia Community`} description={group.description || ""} />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="h-48 bg-gradient-to-br from-primary/30 to-primary/10 relative">
          {group.image_url && (
            <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-background/50 backdrop-blur"
            onClick={() => navigate("/community")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="container mx-auto px-4 -mt-16 relative z-10">
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-bold">{group.name}</h1>
                    <Badge variant="secondary">
                      {group.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                      {group.is_public ? "Public" : "Private"}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">{group.description}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count} members</span>
                  </div>
                </div>
                {user && (
                  isMember ? (
                    <Button variant="outline" onClick={leaveGroup}>Leave Group</Button>
                  ) : (
                    <Button onClick={joinGroup} disabled={joining}>
                      {joining ? "Joining..." : "Join Group"}
                    </Button>
                  )
                )}
              </div>
            </CardHeader>
          </Card>

          {/* Create Post */}
          {isMember && (
            <Card className="mb-6">
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Share something with the group..."
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  className="mb-3"
                />
                {showEventPicker && (
                  <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                    <SelectTrigger className="mb-3">
                      <SelectValue placeholder="Select an event to share" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id}>
                          {event.title} - {format(new Date(event.date), "MMM d")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEventPicker(!showEventPicker)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Event
                  </Button>
                  <Button onClick={createPost} disabled={posting || !newPost.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts */}
          <div className="space-y-4 pb-8">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Posts Yet</h3>
                  <p className="text-muted-foreground">
                    {isMember ? "Be the first to share something!" : "Join the group to start posting"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => {
                const profile = profiles[post.user_id];
                return (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      {/* Post Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={profile?.profile_image_url || ""} />
                          <AvatarFallback>
                            {profile?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{profile?.full_name || "Anonymous"}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Post Content */}
                      <p className="mb-3 whitespace-pre-wrap">{post.content}</p>

                      {/* Shared Event */}
                      {post.event && (
                        <Card
                          className="mb-3 cursor-pointer hover:bg-muted/50 transition"
                          onClick={() => navigate(`/events/${post.event?.slug || post.event?.id}`)}
                        >
                          <CardContent className="p-4">
                            <p className="font-medium text-primary">{post.event.title}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(post.event.date), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {post.event.location}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-4 pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={likedPosts.has(post.id) ? "text-red-500" : ""}
                          onClick={() => toggleLike(post.id)}
                        >
                          <Heart className={`h-4 w-4 mr-1 ${likedPosts.has(post.id) ? "fill-current" : ""}`} />
                          {post.likes_count}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          {post.comments_count}
                        </Button>
                      </div>

                      {/* Comments */}
                      {expandedComments.has(post.id) && (
                        <div className="mt-4 pt-4 border-t space-y-3">
                          {comments[post.id]?.map((comment) => {
                            const commentProfile = profiles[comment.user_id];
                            return (
                              <div key={comment.id} className="flex gap-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={commentProfile?.profile_image_url || ""} />
                                  <AvatarFallback className="text-xs">
                                    {commentProfile?.full_name?.charAt(0) || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 bg-muted rounded-lg px-3 py-2">
                                  <p className="text-sm font-medium">{commentProfile?.full_name || "Anonymous"}</p>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            );
                          })}
                          {isMember && (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Write a comment..."
                                value={newComments[post.id] || ""}
                                onChange={(e) => setNewComments(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => e.key === "Enter" && addComment(post.id)}
                              />
                              <Button size="icon" onClick={() => addComment(post.id)}>
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GroupDetail;
