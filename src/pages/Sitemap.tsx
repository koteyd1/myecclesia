
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, FileText, Home, Info, Mail, Heart, HelpCircle, Shield, ScrollText, ExternalLink } from "lucide-react";

const Sitemap = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching sitemap data...');
        
        // Get current date to filter future events
        const today = new Date().toISOString().split('T')[0];

        // Fetch active events
        const { data: eventsData, error: eventsError } = await supabase
          .from('events')
          .select('id, title, date')
          .gte('date', today)
          .order('date', { ascending: true })
          .limit(10);

        if (eventsError) {
          console.error('Error fetching events:', eventsError);
          setError(`Error fetching events: ${eventsError.message}`);
        } else {
          console.log('Events fetched:', eventsData);
          setEvents(eventsData || []);
        }

        // Fetch published blog posts
        const { data: blogData, error: blogError } = await supabase
          .from('blog_posts')
          .select('id, title')
          .eq('published', true)
          .order('updated_at', { ascending: false })
          .limit(10);

        if (blogError) {
          console.error('Error fetching blog posts:', blogError);
          setError(`Error fetching blog posts: ${blogError.message}`);
        } else {
          console.log('Blog posts fetched:', blogData);
          setBlogPosts(blogData || []);
        }

      } catch (error) {
        console.error('Error fetching sitemap data:', error);
        setError('Failed to load sitemap data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const staticPages = [
    { path: "/", title: "Home", icon: Home, description: "Welcome to MyEcclesia" },
    { path: "/events", title: "Events", icon: Calendar, description: "Discover upcoming church events" },
    { path: "/calendar", title: "Calendar", icon: Calendar, description: "View our event calendar" },
    { path: "/blog", title: "Blog", icon: FileText, description: "Read our latest articles and insights" },
    { path: "/about", title: "About", icon: Info, description: "Learn more about our mission" },
    { path: "/contact", title: "Contact", icon: Mail, description: "Get in touch with us" },
    { path: "/donate", title: "Donate", icon: Heart, description: "Support our ministry" },
    { path: "/help-centre", title: "Help Centre", icon: HelpCircle, description: "Find answers to common questions" },
    { path: "/event-guidelines", title: "Event Guidelines", icon: ScrollText, description: "Event submission guidelines" },
    { path: "/privacy-policy", title: "Privacy Policy", icon: Shield, description: "Our privacy policy" },
    { path: "/terms-and-conditions", title: "Terms & Conditions", icon: ScrollText, description: "Terms and conditions" },
  ];

  return (
    <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Site Map
            </h1>
            <p className="text-lg text-muted-foreground">
              Navigate through all pages and content on MyEcclesia
            </p>
          </div>

          {error && (
            <Card className="mb-8 border-destructive">
              <CardContent className="p-4">
                <p className="text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Static Pages */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Main Pages
              </CardTitle>
              <CardDescription>
                Core pages and sections of our website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {staticPages.map((page) => {
                  const Icon = page.icon;
                  return (
                    <Link
                      key={page.path}
                      to={page.path}
                      className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                    >
                      <Icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {page.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {page.description}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Events */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Events
                <Badge variant="secondary">{events.length}</Badge>
              </CardTitle>
              <CardDescription>
                Recent and upcoming church events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : events.length > 0 ? (
                <div className="space-y-3">
                  {events.map((event) => (
                    <Link
                      key={event.id}
                      to={`/events/${event.id}`}
                      className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                    >
                      <div>
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString('en-GB', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                  {events.length === 10 && (
                    <div className="text-center pt-2">
                      <Link 
                        to="/events" 
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        View all events →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No upcoming events found
                  </p>
                  <Link 
                    to="/events" 
                    className="text-sm text-primary hover:text-primary/80 transition-colors inline-block mt-2"
                  >
                    Check all events →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Blog Posts */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Latest Blog Posts
                <Badge variant="secondary">{blogPosts.length}</Badge>
              </CardTitle>
              <CardDescription>
                Recent articles and insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : blogPosts.length > 0 ? (
                <div className="space-y-3">
                  {blogPosts.map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.id}`}
                      className="group flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200"
                    >
                      <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </Link>
                  ))}
                  {blogPosts.length === 10 && (
                    <div className="text-center pt-2">
                      <Link 
                        to="/blog" 
                        className="text-sm text-primary hover:text-primary/80 transition-colors"
                      >
                        View all blog posts →
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    No blog posts found
                  </p>
                  <Link 
                    to="/blog" 
                    className="text-sm text-primary hover:text-primary/80 transition-colors inline-block mt-2"
                  >
                    Check all blog posts →
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Separator className="my-8" />

          {/* XML Sitemap Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-primary" />
                XML Sitemap
              </CardTitle>
              <CardDescription>
                Machine-readable sitemap for search engines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/sitemap.xml"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary-dark transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                View XML Sitemap
              </Link>
              <p className="text-sm text-muted-foreground mt-2">
                This is the technical sitemap used by search engines to crawl and index our website.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sitemap;
