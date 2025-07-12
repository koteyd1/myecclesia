import Header from "@/components/Header";
import BlogCard from "@/components/BlogCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fallback blog data in case database is empty
  const fallbackBlogPosts = [
    {
      id: "1",
      title: "Finding Hope in Difficult Times",
      excerpt: "Life can be challenging, and we all face moments when hope seems distant. In this post, we explore how faith can be an anchor during storms and how our community can support one another through prayer and fellowship.",
      author: "Pastor John Smith",
      date: "2024-01-15",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop",
      category: "Faith"
    },
    {
      id: "2",
      title: "The Power of Community Service",
      excerpt: "Discover how serving others transforms not only the lives we touch but our own hearts as well. Learn about our recent community outreach programs and how you can get involved in making a difference.",
      author: "Sarah Johnson",
      date: "2024-01-10",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
      category: "Service"
    },
    {
      id: "3",
      title: "Building Strong Family Foundations",
      excerpt: "Strong families are the cornerstone of our community. Explore practical ways to strengthen family bonds through faith-based principles, communication, and shared values that last a lifetime.",
      author: "Michael Davis",
      date: "2024-01-08",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=400&fit=crop",
      category: "Family"
    },
    {
      id: "4",
      title: "Youth Ministry: Nurturing the Next Generation",
      excerpt: "Our youth are the future of our church and community. Learn about our youth programs, upcoming events, and how we're helping young people develop their faith and leadership skills.",
      author: "Emily Roberts",
      date: "2024-01-05",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&h=400&fit=crop",
      category: "Youth"
    },
    {
      id: "5",
      title: "The Art of Worship: Music and Praise",
      excerpt: "Music has always been a powerful way to connect with God and express our faith. Discover the history and meaning behind our worship songs and how music ministry enriches our spiritual journey.",
      author: "David Wilson",
      date: "2024-01-03",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop",
      category: "Worship"
    },
    {
      id: "6",
      title: "Preparing for Easter: A Season of Reflection",
      excerpt: "As we approach the Easter season, it's time to prepare our hearts for reflection and renewal. Join us in exploring the significance of this holy time and how we can make the most of this spiritual journey.",
      author: "Pastor John Smith",
      date: "2024-01-01",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1460904577954-8fadb262612c?w=800&h=400&fit=crop",
      category: "Faith"
    }
  ];

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Use database posts if available, otherwise use fallback
      setBlogPosts(data && data.length > 0 ? data : fallbackBlogPosts);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      // Use fallback data on error
      setBlogPosts(fallbackBlogPosts);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories from both database and fallback posts
  const allPosts = [...blogPosts, ...fallbackBlogPosts];
  const categories = ["All", ...new Set(allPosts.map(post => post.category).filter(Boolean))];

  const filteredPosts = blogPosts.filter(post => {
    const searchContent = post.excerpt || post.content || "";
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Church Blog</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Stay connected with our community through inspiring stories, faith reflections, and updates on church life.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search blog posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">Loading blog posts...</p>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard 
                key={post.id} 
                {...post} 
                readTime={`${Math.ceil((post.content?.length || 0) / 200)} min read`}
                date={new Date(post.created_at || post.date).toISOString().split('T')[0]}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">No blog posts found matching your criteria.</p>
            <p className="text-muted-foreground">Try adjusting your search or category filter.</p>
          </div>
        )}

        {/* Featured Categories */}
        <div className="mt-16 pt-16 border-t">
          <h2 className="text-2xl font-semibold text-foreground mb-8 text-center">Explore Topics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {categories.slice(1).map((category) => (
              <div
                key={category}
                className="text-center p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => setSelectedCategory(category)}
              >
                <h3 className="font-medium text-foreground">{category}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {allPosts.filter(post => post.category === category).length} posts
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;