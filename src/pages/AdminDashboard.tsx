import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, Calendar, Users, BookOpen } from "lucide-react";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const denominationOptions = [
    "All Welcome",
    "Baptist",
    "Methodist",
    "Presbyterian",
    "Lutheran",
    "Episcopal",
    "Catholic",
    "Pentecostal",
    "Orthodox",
    "Anglican",
    "Congregational",
    "Reformed",
    "Evangelical",
    "Non-denominational",
    "Interfaith"
  ];

  const categoryOptions = [
    "Worship Service",
    "Bible Study",
    "Prayer Meeting",
    "Youth Events",
    "Children's Ministry",
    "Community Outreach",
    "Missions",
    "Conferences",
    "Retreats",
    "Camps",
    "Fellowship",
    "Music Ministry",
    "Special Events",
    "Holiday Celebrations",
    "Educational",
    "Fundraising"
  ];
  const [isAdmin, setIsAdmin] = useState(false);
  const [events, setEvents] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateBlogForm, setShowCreateBlogForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [editingBlogPost, setEditingBlogPost] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    image: "",
    price: 0,
    available_tickets: 0,
    category: "",
    denominations: "",
    organizer: "",
    duration: "",
    requirements: "",
    external_url: ""
  });

  const [blogFormData, setBlogFormData] = useState({
    title: "",
    content: "",
    excerpt: "",
    author: "",
    category: "",
    image: "",
    published: false
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    checkAdminRole();
    fetchEvents();
    fetchBlogPosts();
  }, [user, navigate]);

  const checkAdminRole = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.error("Error checking admin role:", error);
        return;
      }

      if (data?.role !== "admin") {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have admin privileges.",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("date", { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load events.",
      });
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBlogPosts(data || []);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load blog posts.",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const eventData = {
        ...formData,
        created_by: user.id,
        price: parseFloat(formData.price.toString()),
        available_tickets: parseInt(formData.available_tickets.toString())
      };

      let result;
      if (editingEvent) {
        result = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingEvent.id);
      } else {
        result = await supabase
          .from("events")
          .insert(eventData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success!",
        description: `Event ${editingEvent ? "updated" : "created"} successfully.`,
      });

      setShowCreateForm(false);
      setEditingEvent(null);
      setFormData({
        title: "",
        description: "",
        date: "",
        time: "",
        location: "",
        image: "",
        price: 0,
        available_tickets: 0,
        category: "",
        denominations: "",
        organizer: "",
        duration: "",
        requirements: "",
        external_url: ""
      });
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save event.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      location: event.location,
      image: event.image || "",
      price: event.price,
      available_tickets: event.available_tickets,
      category: event.category || "",
      denominations: event.denominations || "",
      organizer: event.organizer || "",
      duration: event.duration || "",
      requirements: event.requirements || "",
      external_url: event.external_url || ""
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Event deleted successfully.",
      });

      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete event.",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBlogSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const blogData = {
        ...blogFormData,
        created_by: user.id
      };

      let result;
      if (editingBlogPost) {
        result = await supabase
          .from("blog_posts")
          .update(blogData)
          .eq("id", editingBlogPost.id);
      } else {
        result = await supabase
          .from("blog_posts")
          .insert(blogData);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success!",
        description: `Blog post ${editingBlogPost ? "updated" : "created"} successfully.`,
      });

      setShowCreateBlogForm(false);
      setEditingBlogPost(null);
      setBlogFormData({
        title: "",
        content: "",
        excerpt: "",
        author: "",
        category: "",
        image: "",
        published: false
      });
      fetchBlogPosts();
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save blog post.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBlogEdit = (blogPost) => {
    setEditingBlogPost(blogPost);
    setBlogFormData({
      title: blogPost.title,
      content: blogPost.content,
      excerpt: blogPost.excerpt || "",
      author: blogPost.author,
      category: blogPost.category || "",
      image: blogPost.image || "",
      published: blogPost.published
    });
    setShowCreateBlogForm(true);
  };

  const handleBlogDelete = async (blogPostId) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;

    try {
      const { error } = await supabase
        .from("blog_posts")
        .delete()
        .eq("id", blogPostId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Blog post deleted successfully.",
      });

      fetchBlogPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete blog post.",
      });
    }
  };

  const handleBlogChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBlogFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage church events, blog posts and registrations</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Blog Posts</p>
                  <p className="text-2xl font-bold">{blogPosts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Available Spots</p>
                  <p className="text-2xl font-bold">
                    {events.reduce((sum, event) => sum + (event.available_tickets || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Badge className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Published Blogs</p>
                  <p className="text-2xl font-bold">
                    {blogPosts.filter(post => post.published).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="events" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="blogs">Blog Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Event Management</h2>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Create/Edit Event Form */}
            {showCreateForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleSelectChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="denominations">Denominations</Label>
                    <Select
                      value={formData.denominations}
                      onValueChange={(value) => handleSelectChange("denominations", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select denomination" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-50">
                        {denominationOptions.map((denomination) => (
                          <SelectItem key={denomination} value={denomination}>
                            {denomination}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="organizer">Organizer</Label>
                    <Input
                      id="organizer"
                      name="organizer"
                      value={formData.organizer}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <Label htmlFor="available_tickets">Available Tickets</Label>
                    <Input
                      id="available_tickets"
                      name="available_tickets"
                      type="number"
                      value={formData.available_tickets}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    name="image"
                    type="url"
                    value={formData.image}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                
                <div>
                  <Label htmlFor="external_url">Event Website Link</Label>
                  <Input
                    id="external_url"
                    name="external_url"
                    type="url"
                    value={formData.external_url}
                    onChange={handleChange}
                    placeholder="https://example.com/event-registration"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Users will be redirected to this link after signing up
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateForm(false);
                      setEditingEvent(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
            </Card>
            )}

            {/* Events List */}
            <Card>
              <CardHeader>
                <CardTitle>Manage Events</CardTitle>
                <CardDescription>View, edit, or delete existing events</CardDescription>
              </CardHeader>
              <CardContent>
                {events.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No events created yet. Create your first event!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{event.title}</h3>
                          <div className="text-sm text-muted-foreground">
                            {event.date} at {event.time} • {event.location}
                          </div>
                          {event.category && (
                            <Badge variant="outline" className="mt-1">
                              {event.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(event)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blogs" className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Blog Management</h2>
              <Button onClick={() => setShowCreateBlogForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Blog Post
              </Button>
            </div>

            {/* Create/Edit Blog Form */}
            {showCreateBlogForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{editingBlogPost ? "Edit Blog Post" : "Create New Blog Post"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleBlogSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title">Title *</Label>
                        <Input
                          id="title"
                          name="title"
                          value={blogFormData.title}
                          onChange={handleBlogChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="author">Author *</Label>
                        <Input
                          id="author"
                          name="author"
                          value={blogFormData.author}
                          onChange={handleBlogChange}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          name="category"
                          value={blogFormData.category}
                          onChange={handleBlogChange}
                          placeholder="Faith, Service, Family, etc."
                        />
                      </div>
                      <div>
                        <Label htmlFor="image">Featured Image URL</Label>
                        <Input
                          id="image"
                          name="image"
                          type="url"
                          value={blogFormData.image}
                          onChange={handleBlogChange}
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="excerpt">Excerpt</Label>
                      <Textarea
                        id="excerpt"
                        name="excerpt"
                        value={blogFormData.excerpt}
                        onChange={handleBlogChange}
                        rows={2}
                        placeholder="A brief summary of the blog post..."
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Content *</Label>
                      <Textarea
                        id="content"
                        name="content"
                        value={blogFormData.content}
                        onChange={handleBlogChange}
                        rows={10}
                        required
                        placeholder="Write your blog post content here..."
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="published"
                        name="published"
                        checked={blogFormData.published}
                        onCheckedChange={(checked) => setBlogFormData(prev => ({ ...prev, published: checked }))}
                      />
                      <Label htmlFor="published">Publish immediately</Label>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : editingBlogPost ? "Update Blog Post" : "Create Blog Post"}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowCreateBlogForm(false);
                          setEditingBlogPost(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Blog Posts List */}
            <Card>
              <CardHeader>
                <CardTitle>Manage Blog Posts</CardTitle>
                <CardDescription>View, edit, or delete existing blog posts</CardDescription>
              </CardHeader>
              <CardContent>
                {blogPosts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No blog posts created yet. Create your first blog post!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {blogPosts.map((blogPost) => (
                      <div key={blogPost.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold">{blogPost.title}</h3>
                          <div className="text-sm text-muted-foreground">
                            By {blogPost.author} • {new Date(blogPost.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex gap-2 mt-1">
                            {blogPost.category && (
                              <Badge variant="outline">
                                {blogPost.category}
                              </Badge>
                            )}
                            <Badge variant={blogPost.published ? "default" : "secondary"}>
                              {blogPost.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBlogEdit(blogPost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleBlogDelete(blogPost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;