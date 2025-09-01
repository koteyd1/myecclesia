import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { linkifyText } from "@/utils/linkify";
import { useSiteTracking, useBlogTracking } from "@/hooks/useSiteTracking";

const BlogPost = () => {
  const { slug } = useParams();
  const [blogPost, setBlogPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useSiteTracking(blogPost?.title ? `${blogPost.title} - Blog` : "Blog Post");
  useBlogTracking(blogPost?.id);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      // Try to fetch from database first using slug
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (data) {
        setBlogPost(data);
      } else {
        // Fallback to hardcoded posts if not found in database
        const fallbackPost = getFallbackPost(slug);
        setBlogPost(fallbackPost);
      }
    } catch (error) {
      console.error("Error fetching blog post:", error);
      // Try fallback
      const fallbackPost = getFallbackPost(slug);
      setBlogPost(fallbackPost);
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackPost = (postId) => {
    const fallbackPosts = [
      {
        id: "1",
        title: "Finding Hope in Difficult Times",
        content: "<p>Life can be challenging, and we all face moments when hope seems distant. In these times, our faith becomes not just a comfort, but an anchor. The Bible reminds us in Hebrews 6:19 that 'hope is an anchor for the soul, firm and secure.'</p><h3>Community Support Makes a Difference</h3><p>One of the beautiful aspects of being part of a church community is that we don't have to face our challenges alone. When one member suffers, we all suffer together. Our prayer ministry has seen incredible testimonies of healing, provision, and breakthrough.</p><h3>Practical Steps for Finding Hope</h3><p>Here are some practical ways to nurture hope during difficult seasons:</p><ul><li>Stay connected to community: Don't isolate yourself</li><li>Maintain spiritual practices: Continue in prayer and worship</li><li>Serve others: Help someone else who is struggling</li><li>Remember past faithfulness: Reflect on how God has carried you through</li><li>Seek professional help when needed: There's no shame in counseling</li></ul><p>If you're walking through a difficult time right now, please know that you're not alone. Our church family is here to support you, pray with you, and walk alongside you.</p>",
        author: "Pastor John Smith",
        date: "2024-01-15",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=600&fit=crop",
        category: "Faith",
        slug: "finding-hope-in-difficult-times",
        excerpt: "Life can be challenging, and we all face moments when hope seems distant. In this post, we explore how faith can be an anchor during storms and how our community can support one another through prayer and fellowship."
      },
      {
        id: "2",
        title: "The Power of Community Service",
        content: "<p>Service to others is one of the most profound ways we can live out our faith. When we extend our hands to help those in need, we become the hands and feet of Christ in our community.</p><p>Our recent community outreach programs have touched countless lives, from our food pantry that serves over 100 families monthly to our after-school tutoring program that helps children succeed academically.</p><h3>The Impact of Giving</h3><p>When we serve others, something beautiful happens—we discover that we receive far more than we give. The joy on a child's face when they master a difficult concept, the relief in a parent's eyes when they can provide groceries for their family—these moments transform both the giver and the receiver.</p><h3>Ways to Get Involved</h3><p>There are many ways you can make a difference:</p><ul><li>Food Ministry: Help pack and distribute groceries</li><li>Youth Mentoring: Support local students academically</li><li>Senior Care: Visit elderly community members</li><li>Home Repairs: Use your skills to help maintain homes</li></ul><p>Remember, no act of service is too small. Your contribution matters and makes a real difference in someone's life.</p>",
        author: "Sarah Johnson",
        date: "2024-01-10",
        readTime: "7 min read",
        image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&h=600&fit=crop",
        category: "Service",
        slug: "the-power-of-community-service",
        excerpt: "Discover how serving others transforms not only the lives we touch but our own hearts as well. Learn about our recent community outreach programs and how you can get involved in making a difference."
      },
      {
        id: "3",
        title: "Building Strong Family Foundations",
        content: "<p>Strong families are the cornerstone of our community. In a world that often pulls families apart, we must be intentional about building foundations that will last for generations.</p><h3>Faith-Based Principles</h3><p>The foundation of a strong family begins with shared values and faith. When families pray together, study scripture together, and serve together, they develop bonds that can weather any storm.</p><h3>Communication and Love</h3><p>Effective communication is essential for healthy family relationships. This means listening actively, speaking with kindness, and addressing conflicts with grace and understanding.</p><h3>Creating Lasting Traditions</h3><p>Family traditions create memories and strengthen bonds. Whether it's weekly family dinners, annual vacations, or simple bedtime routines, these consistent practices help children feel secure and loved.</p><h3>Navigating Modern Challenges</h3><p>Today's families face unique challenges from technology, busy schedules, and cultural pressures. By staying grounded in faith and prioritizing family time, we can navigate these challenges successfully.</p><p>Investing in the future means investing in our families today. Let's commit to building strong foundations that will bless generations to come.</p>",
        author: "Michael Davis",
        date: "2024-01-08",
        readTime: "6 min read",
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=600&fit=crop",
        category: "Family",
        slug: "building-strong-family-foundations",
        excerpt: "Strong families are the cornerstone of our community. Explore practical ways to strengthen family bonds through faith-based principles, communication, and shared values that last a lifetime."
      },
      {
        id: "4",
        title: "Youth Ministry: Nurturing the Next Generation",
        content: "<p>Young people today face unique challenges that previous generations never encountered. From social media pressures to academic stress, our youth need strong support systems and positive role models.</p><p>Our youth ministry is committed to providing a safe, fun, and spiritually enriching environment where teenagers can grow in their faith while building lasting friendships.</p><h3>Current Youth Programs</h3><p>We offer several programs designed to meet young people where they are:</p><ul><li>Wednesday Night Youth Group: Bible study, games, and fellowship for ages 13-18</li><li>Youth Leadership Team: Training opportunities for teens who want to develop their leadership skills</li><li>Summer Mission Trips: Service opportunities that help young people see the world beyond their own community</li><li>Mentorship Program: One-on-one relationships between teens and adult mentors</li></ul><h3>Building Character and Faith</h3><p>Our goal isn't just to entertain young people—it's to help them develop strong character and a genuine faith that will carry them through life's challenges. We do this through relevant teaching, authentic relationships, and opportunities to serve others.</p><p>If you have a teenager, we'd love to have them join us. If you're an adult who feels called to work with young people, we always need volunteers who can pour into the next generation.</p>",
        author: "Emily Roberts",
        date: "2024-01-05",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&h=600&fit=crop",
        category: "Youth",
        slug: "youth-ministry-nurturing-the-next-generation",
        excerpt: "Our youth are the future of our church and community. Learn about our youth programs, upcoming events, and how we're helping young people develop their faith and leadership skills."
      },
      {
        id: "5",
        title: "The Art of Worship: Music and Praise",
        content: "<p>Music has been an integral part of worship since ancient times. From the Psalms of David to the hymns of the early church to contemporary worship songs, music helps us express our love for God in ways that words alone cannot.</p><p>In our worship services, we strive to create an atmosphere where people can genuinely connect with God through song, whether that's through traditional hymns or contemporary praise music.</p><h3>The Heart of Worship</h3><p>True worship isn't about the style of music—it's about the condition of our hearts. Whether we're singing a centuries-old hymn or a song written last week, the goal is the same: to honor God and express our love and gratitude to Him.</p><p>Our worship team is made up of volunteers who share a passion for using their musical gifts to serve God and the church. They spend hours each week practicing, not for personal recognition, but to help facilitate meaningful worship experiences.</p><h3>Join the Ministry</h3><p>If you have musical talents—whether you sing, play an instrument, or have technical skills—we'd love to have you join our worship ministry. We're always looking for people who want to use their gifts to serve God and bless others.</p><p>Even if you don't consider yourself musically talented, you can still participate in worship by singing along, clapping, or simply opening your heart to God's presence as we gather together in praise.</p>",
        author: "David Wilson",
        date: "2024-01-03",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop",
        category: "Worship",
        slug: "the-art-of-worship-music-and-praise",
        excerpt: "Music has always been a powerful way to connect with God and express our faith. Discover the history and meaning behind our worship songs and how music ministry enriches our spiritual journey."
      },
      {
        id: "6",
        title: "Preparing for Easter: A Season of Reflection",
        content: "<p>Easter is the cornerstone of the Christian faith—the celebration of Jesus' victory over death and the promise of eternal life for all who believe. But Easter isn't just a single day; it's the culmination of a season of preparation and reflection.</p><p>The weeks leading up to Easter, known as Lent, provide an opportunity for us to examine our hearts, confess our sins, and recommit ourselves to following Christ.</p><h3>The Journey of Lent</h3><p>Lent is a 40-day period of spiritual preparation that mirrors Jesus' 40 days of fasting in the wilderness. During this time, many Christians choose to give up certain luxuries or habits as a form of spiritual discipline.</p><p>However, Lent isn't just about giving things up—it's also about taking things on. Consider adding spiritual practices like daily Bible reading, extra prayer time, or acts of service to your routine.</p><h3>Holy Week</h3><p>The final week before Easter, known as Holy Week, takes us through the final days of Jesus' earthly ministry. From His triumphant entry into Jerusalem on Palm Sunday to His crucifixion on Good Friday to His resurrection on Easter Sunday, this week encapsulates the entire gospel message.</p><p>We encourage you to participate in our Holy Week services, including our Maundy Thursday communion service and our Good Friday reflection service. These services help us enter into the story of Christ's passion in a deeper way.</p><h3>Resurrection Sunday</h3><p>Easter Sunday is a celebration like no other. It's a day when we proclaim with joy that death has been defeated and that we have hope for eternal life through Jesus Christ.</p><p>Join us for our Easter celebration services as we worship the risen Savior together. It's a day of joy, hope, and renewed faith that reminds us why we call ourselves Christians.</p>",
        author: "Pastor John Smith",
        date: "2024-01-01",
        readTime: "8 min read",
        image: "https://images.unsplash.com/photo-1460904577954-8fadb262612c?w=1200&h=600&fit=crop",
         category: "Faith",
         slug: "preparing-for-easter-a-season-of-reflection",
         excerpt: "As we approach the Easter season, it's time to prepare our hearts for reflection and renewal. Join us in exploring the significance of this holy time and how we can make the most of this spiritual journey."
       },
       {
         id: "7",
         title: "Upcoming Christian Events in the UK: Aug-Dec 2025",
         content: "<p>Exciting Christian events are coming to the UK in the second half of 2025! From inspiring conferences to local church gatherings, there's something for every believer looking to grow in their faith and connect with fellow Christians.</p><h3>Major Conferences</h3><p>Several major Christian conferences are scheduled for this period, featuring renowned speakers, worship leaders, and opportunities for spiritual growth. These events bring together thousands of believers from across the nation.</p><h3>Local Church Events</h3><p>Beyond the large conferences, numerous local churches are hosting special events including:</p><ul><li>Revival meetings and prayer gatherings</li><li>Community outreach programs</li><li>Youth camps and family retreats</li><li>Worship nights and concert events</li><li>Bible study conferences</li></ul><h3>How to Stay Updated</h3><p>To stay informed about these upcoming events, make sure to check our events calendar regularly. You can also subscribe to our newsletter for the latest updates on Christian events happening near you.</p><p>Don't miss out on these incredible opportunities to grow in your faith, make new connections, and be part of the vibrant UK Christian community. Book your tickets early as popular events tend to sell out quickly!</p>",
         author: "Events Team",
         date: "2024-08-15",
         readTime: "4 min read",
         image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&h=600&fit=crop",
         category: "Events",
         slug: "upcoming-christian-events-in-the-uk-augdec-2025-",
         excerpt: "Discover the most exciting Christian events coming to the UK from August to December 2025. From major conferences to local church gatherings, find opportunities to grow in faith."
       }
     ];

     return fallbackPosts.find(post => 
       post.slug === postId || 
       post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === postId ||
       post.id === postId
     ) || null;
   };

  if (isLoading) {
    return (
      <>
        <SEOHead 
          title="Loading... | MyEcclesia Blog"
          description="Loading blog post content..."
          canonicalUrl={`https://myecclesia.com/blog/${slug}`}
        />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <p>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!blogPost) {
    return (
      <>
        <SEOHead 
          title="Blog Post Not Found | MyEcclesia"
          description="The blog post you're looking for doesn't exist."
          canonicalUrl={`https://myecclesia.com/blog/${slug}`}
          noIndex={true}
        />
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Blog Post Not Found</h1>
            <p className="text-muted-foreground mb-8">The blog post you're looking for doesn't exist.</p>
            <Button onClick={() => navigate("/blog")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title={`${blogPost.title} | MyEcclesia Blog`}
        description={blogPost?.excerpt || blogPost?.content?.slice(0, 160) || "Read inspiring Christian articles and faith stories on MyEcclesia blog."}
        keywords={`${blogPost?.category || 'Christian'}, faith, blog, ${blogPost?.author || 'MyEcclesia'}`}
        canonicalUrl={`https://myecclesia.com/blog/${slug}`}
        type="article"
        publishedTime={blogPost?.created_at || blogPost?.date}
        author={blogPost?.author}
        ogImage={blogPost?.image}
      />
      <div className="min-h-screen bg-background">
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/blog")}
            className="mb-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Blog
          </Button>

          <article className="max-w-4xl mx-auto">
            {/* Hero Image */}
            {blogPost.image && (
              <div className="mb-8 rounded-lg overflow-hidden">
                <img 
                  src={blogPost.image} 
                  alt={blogPost.title}
                  className="w-full h-64 md:h-96 object-cover"
                />
              </div>
            )}

            {/* Article Header */}
            <header className="mb-8">
              <div className="flex flex-wrap gap-2 mb-4">
                {blogPost.category && (
                  <Badge variant="secondary">
                    {blogPost.category}
                  </Badge>
                )}
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
                {blogPost.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{blogPost.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(blogPost.created_at || blogPost.date).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{blogPost.readTime || `${Math.ceil((blogPost.content?.length || 0) / 200)} min read`}</span>
                </div>
              </div>
            </header>

            {/* Article Content */}
            <div className="prose prose-lg max-w-none">
              {blogPost.excerpt && (
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  {blogPost.excerpt}
                </p>
              )}
              
              <div 
                className="space-y-6 text-foreground leading-relaxed prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: blogPost.content }}
              />
            </div>

            {/* Article Footer */}
            <footer className="mt-12 pt-8 border-t">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/blog")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blog
                </Button>
              </div>
            </footer>
          </article>
        </main>
      </div>
    </>
  );
};

export default BlogPost;
