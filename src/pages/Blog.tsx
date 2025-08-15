import Header from "@/components/Header";
import BlogCard from "@/components/BlogCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogPosts, setBlogPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);


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
      
      // Only use database posts to showcase active blogs
      setBlogPosts(data || []);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      // Show empty state on error instead of fallback
      setBlogPosts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get unique categories from published blog posts only
  const publishedPosts = blogPosts.filter(post => post.published !== false);
  const categories = ["All", ...new Set(publishedPosts.map(post => post.category).filter(Boolean))];

  const filteredPosts = blogPosts.filter(post => {
    const searchContent = post.excerpt || post.content || "";
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         searchContent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Generate blog schema for SEO
  const blogSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "MyEcclesia Christian Blog",
    "description": "Inspiring Christian stories, faith reflections, and church community updates from MyEcclesia",
    "url": "https://myecclesia.com/blog",
    "author": {
      "@type": "Organization",
      "name": "MyEcclesia"
    },
    "publisher": {
      "@type": "Organization",
      "name": "MyEcclesia",
      "logo": {
        "@type": "ImageObject",
        "url": "https://myecclesia.com/myecclesia-logo.png"
      }
    },
    "blogPost": filteredPosts.slice(0, 5).map(post => ({
      "@type": "BlogPosting",
      "headline": post.title,
      "description": post.excerpt || post.content?.substring(0, 160),
      "author": {
        "@type": "Person",
        "name": post.author
      },
      "datePublished": post.created_at,
      "url": `https://myecclesia.com/blog/${post.id}`,
      "articleSection": post.category
    }))
  };

  return (
    <>
      <SEOHead 
        title="Christian Blog – Faith Stories & Community Updates | MyEcclesia"
        description="Read inspiring Christian stories, faith reflections, and church community updates. Stay connected with the UK Christian community through our blog."
        keywords="Christian blog, faith stories, church community, Christian testimony, spiritual growth, UK Christianity"
        canonicalUrl="https://myecclesia.com/blog"
      />
      <div className="min-h-screen bg-background">
        <StructuredData data={blogSchema} />
        <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNav />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Christian Blog</h1>
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


        {/* Featured Categories - Explore Topics */}
        {categories.length > 1 && (
          <div className="mt-16 pt-16 border-t">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-semibold text-foreground mb-4">Explore Topics</h2>
              <p className="text-muted-foreground">Discover our active blog categories and dive into topics that inspire your faith journey</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.slice(1).map((category) => {
                const categoryPosts = publishedPosts.filter(post => post.category === category);
                const postCount = categoryPosts.length;
                const latestPost = categoryPosts[0]; // Most recent post in this category
                
                return (
                  <div
                    key={category}
                    className="group cursor-pointer bg-card rounded-lg border p-6 hover:shadow-md transition-all duration-300 hover:border-primary/20"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {postCount} post{postCount !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    
                    {latestPost && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Latest post:</p>
                        <h4 className="font-medium text-foreground line-clamp-2 leading-snug">
                          {latestPost.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          By {latestPost.author} • {new Date(latestPost.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    
                    <div className="mt-4 text-sm text-primary group-hover:text-primary/80 transition-colors">
                      View all {category.toLowerCase()} posts →
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
    </>
  );
};

export default Blog;