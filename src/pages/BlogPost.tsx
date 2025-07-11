import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Clock, Share2, Heart } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BlogPost = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);

  // Mock blog post data - this will come from Supabase later
  const post = {
    id: id,
    title: "Finding Hope in Difficult Times",
    content: `
      <div class="prose prose-lg max-w-none">
        <p>Life has a way of testing our faith and resilience. Whether we're facing personal struggles, health challenges, financial difficulties, or loss, there are moments when hope seems elusive and our path forward unclear.</p>
        
        <p>In these times, our faith becomes not just a comfort, but an anchor. The Bible reminds us in Hebrews 6:19 that "hope is an anchor for the soul, firm and secure." This hope isn't wishful thinking—it's a confident expectation based on God's unchanging character and promises.</p>
        
        <h2>Community Support Makes a Difference</h2>
        
        <p>One of the beautiful aspects of being part of a church community is that we don't have to face our challenges alone. When one member suffers, we all suffer together. When one rejoices, we all rejoice together. This interconnectedness is what makes our faith community so powerful and transformative.</p>
        
        <p>Our prayer ministry has seen incredible testimonies of healing, provision, and breakthrough. Not every prayer is answered in the way we expect, but every prayer is heard, and every person who brings their burdens to our community finds support and encouragement.</p>
        
        <h2>Practical Steps for Finding Hope</h2>
        
        <p>Here are some practical ways to nurture hope during difficult seasons:</p>
        
        <ul>
          <li><strong>Stay connected to community:</strong> Don't isolate yourself. Reach out to friends, family, and church members.</li>
          <li><strong>Maintain spiritual practices:</strong> Even when it's hard, continue in prayer, reading scripture, and worship.</li>
          <li><strong>Serve others:</strong> Sometimes the best way to find hope is to help someone else who is struggling.</li>
          <li><strong>Remember past faithfulness:</strong> Reflect on how God has carried you through previous challenges.</li>
          <li><strong>Seek professional help when needed:</strong> There's no shame in counseling or therapy—God works through many means.</li>
        </ul>
        
        <h2>The Promise of a New Day</h2>
        
        <p>The darkest hour is often just before dawn. While we can't control our circumstances, we can choose our response. We can choose to hold onto hope, to reach out for help, and to trust that this season, however difficult, is not the end of our story.</p>
        
        <p>If you're walking through a difficult time right now, please know that you're not alone. Our church family is here to support you, pray with you, and walk alongside you. Don't hesitate to reach out—we're better together.</p>
      </div>
    `,
    author: "Pastor John Smith",
    date: "2024-01-15",
    readTime: "5 min read",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop",
    category: "Faith",
    likes: 24,
    excerpt: "Life can be challenging, and we all face moments when hope seems distant. In this post, we explore how faith can be an anchor during storms and how our community can support one another through prayer and fellowship."
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "The blog post link has been copied to your clipboard.",
      });
    }
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast({
      title: isLiked ? "Removed from favorites" : "Added to favorites",
      description: isLiked ? "Post removed from your favorites." : "Post added to your favorites.",
    });
  };

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
          <Button onClick={() => navigate("/blog")}>Back to Blog</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blog
        </Button>

        <article className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4 leading-tight">
              {post.title}
            </h1>
            
            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
              <div className="flex items-center text-muted-foreground space-x-6">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  <span>{post.author}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{formatDate(post.date)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>{post.readTime}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLike}
                  className={isLiked ? "text-red-500" : ""}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {post.likes + (isLiked ? 1 : 0)}
                </Button>
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="mb-8">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-64 md:h-96 object-cover rounded-lg"
            />
          </div>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary hover:prose-a:text-primary/80"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Call to Action */}
          <div className="mt-12 p-6 bg-muted/30 rounded-lg text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Need Prayer or Support?
            </h3>
            <p className="text-muted-foreground mb-4">
              Our church family is here for you. Don't hesitate to reach out if you need prayer, encouragement, or someone to talk to.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button onClick={() => navigate("/contact")}>
                Contact Us
              </Button>
              <Button variant="outline" onClick={() => navigate("/events")}>
                Join Our Events
              </Button>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
};

export default BlogPost;