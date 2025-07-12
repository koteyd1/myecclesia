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

  // Mock blog posts data - matches the data from Blog.tsx
  const blogPosts = [
    {
      id: "1",
      title: "Finding Hope in Difficult Times",
      content: `
        <div class="prose prose-lg max-w-none">
          <p>Life has a way of testing our faith and resilience. Whether we're facing personal struggles, health challenges, financial difficulties, or loss, there are moments when hope seems elusive and our path forward unclear.</p>
          
          <p>In these times, our faith becomes not just a comfort, but an anchor. The Bible reminds us in Hebrews 6:19 that "hope is an anchor for the soul, firm and secure." This hope isn't wishful thinking—it's a confident expectation based on God's unchanging character and promises.</p>
          
          <h2>Community Support Makes a Difference</h2>
          
          <p>One of the beautiful aspects of being part of a church community is that we don't have to face our challenges alone. When one member suffers, we all suffer together. When one rejoices, we all rejoices together. This interconnectedness is what makes our faith community so powerful and transformative.</p>
          
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
    },
    {
      id: "2",
      title: "The Power of Community Service",
      content: `
        <div class="prose prose-lg max-w-none">
          <p>Service to others is one of the most profound ways we can live out our faith. When we extend our hands to help those in need, we become the hands and feet of Christ in our community.</p>
          
          <p>Our recent community outreach programs have touched countless lives, from our food pantry that serves over 100 families monthly to our after-school tutoring program that helps children succeed academically.</p>
          
          <h2>The Impact of Giving</h2>
          
          <p>When we serve others, something beautiful happens—we discover that we receive far more than we give. The joy on a child's face when they master a difficult concept, the relief in a parent's eyes when they can provide groceries for their family, the sense of community that builds when neighbors help neighbors—these moments transform both the giver and the receiver.</p>
          
          <h2>Ways to Get Involved</h2>
          
          <p>There are many ways you can make a difference in our community:</p>
          
          <ul>
            <li><strong>Food Ministry:</strong> Help pack and distribute groceries every Saturday morning</li>
            <li><strong>Youth Mentoring:</strong> Spend time with local students who need academic support</li>
            <li><strong>Senior Care:</strong> Visit elderly community members who may be isolated</li>
            <li><strong>Home Repairs:</strong> Use your skills to help maintain homes for those in need</li>
          </ul>
          
          <p>Remember, no act of service is too small. Whether you can volunteer once a month or once a week, your contribution matters and makes a real difference in someone's life.</p>
        </div>
      `,
      author: "Sarah Johnson",
      date: "2024-01-10",
      readTime: "7 min read",
      image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=1200&h=600&fit=crop",
      category: "Service",
      likes: 18,
      excerpt: "Discover how serving others transforms not only the lives we touch but our own hearts as well. Learn about our recent community outreach programs and how you can get involved in making a difference."
    },
    {
      id: "3",
      title: "Building Strong Family Foundations",
      content: `
        <div class="prose prose-lg max-w-none">
          <p>In today's fast-paced world, maintaining strong family relationships can be challenging. Between work, school, and countless activities, families often struggle to find quality time together.</p>
          
          <p>However, building a strong family foundation doesn't require perfection—it requires intentionality. When we prioritize our relationships with our spouse and children, we create a legacy that extends far beyond our own lifetime.</p>
          
          <h2>Faith-Based Family Principles</h2>
          
          <p>Strong families are built on several key principles:</p>
          
          <ul>
            <li><strong>Regular Communication:</strong> Create safe spaces where family members can share their thoughts and feelings without judgment</li>
            <li><strong>Shared Values:</strong> Establish and live by common principles that guide your family's decisions</li>
            <li><strong>Quality Time:</strong> Prioritize activities that bring the family together, such as family dinners and game nights</li>
            <li><strong>Spiritual Growth:</strong> Pray together, attend church together, and discuss faith as a family</li>
          </ul>
          
          <h2>Creating Lasting Memories</h2>
          
          <p>Some of the most meaningful family moments happen in the everyday—reading bedtime stories, cooking together, or simply talking about each other's day. These seemingly small interactions build trust and create the foundation for deeper relationships.</p>
          
          <p>Remember that building strong family foundations is a marathon, not a sprint. Be patient with yourself and your family members as you work together to grow in love and understanding.</p>
        </div>
      `,
      author: "Michael Davis",
      date: "2024-01-08",
      readTime: "6 min read",
      image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1200&h=600&fit=crop",
      category: "Family",
      likes: 32,
      excerpt: "Strong families are the cornerstone of our community. Explore practical ways to strengthen family bonds through faith-based principles, communication, and shared values that last a lifetime."
    },
    {
      id: "4",
      title: "Youth Ministry: Nurturing the Next Generation",
      content: `
        <div class="prose prose-lg max-w-none">
          <p>Young people today face unique challenges that previous generations never encountered. From social media pressures to academic stress, our youth need strong support systems and positive role models.</p>
          
          <p>Our youth ministry is committed to providing a safe, fun, and spiritually enriching environment where teenagers can grow in their faith while building lasting friendships.</p>
          
          <h2>Current Youth Programs</h2>
          
          <p>We offer several programs designed to meet young people where they are:</p>
          
          <ul>
            <li><strong>Wednesday Night Youth Group:</strong> Bible study, games, and fellowship for ages 13-18</li>
            <li><strong>Youth Leadership Team:</strong> Training opportunities for teens who want to develop their leadership skills</li>
            <li><strong>Summer Mission Trips:</strong> Service opportunities that help young people see the world beyond their own community</li>
            <li><strong>Mentorship Program:</strong> One-on-one relationships between teens and adult mentors</li>
          </ul>
          
          <h2>Building Character and Faith</h2>
          
          <p>Our goal isn't just to entertain young people—it's to help them develop strong character and a genuine faith that will carry them through life's challenges. We do this through relevant teaching, authentic relationships, and opportunities to serve others.</p>
          
          <p>If you have a teenager, we'd love to have them join us. If you're an adult who feels called to work with young people, we always need volunteers who can pour into the next generation.</p>
        </div>
      `,
      author: "Emily Roberts",
      date: "2024-01-05",
      readTime: "4 min read",
      image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=1200&h=600&fit=crop",
      category: "Youth",
      likes: 15,
      excerpt: "Our youth are the future of our church and community. Learn about our youth programs, upcoming events, and how we're helping young people develop their faith and leadership skills."
    },
    {
      id: "5",
      title: "The Art of Worship: Music and Praise",
      content: `
        <div class="prose prose-lg max-w-none">
          <p>Music has been an integral part of worship since ancient times. From the Psalms of David to the hymns of the early church to contemporary worship songs, music helps us express our love for God in ways that words alone cannot.</p>
          
          <p>In our worship services, we strive to create an atmosphere where people can genuinely connect with God through song, whether that's through traditional hymns or contemporary praise music.</p>
          
          <h2>The Heart of Worship</h2>
          
          <p>True worship isn't about the style of music—it's about the condition of our hearts. Whether we're singing a centuries-old hymn or a song written last week, the goal is the same: to honor God and express our love and gratitude to Him.</p>
          
          <p>Our worship team is made up of volunteers who share a passion for using their musical gifts to serve God and the church. They spend hours each week practicing, not for personal recognition, but to help facilitate meaningful worship experiences.</p>
          
          <h2>Join the Ministry</h2>
          
          <p>If you have musical talents—whether you sing, play an instrument, or have technical skills—we'd love to have you join our worship ministry. We're always looking for people who want to use their gifts to serve God and bless others.</p>
          
          <p>Even if you don't consider yourself musically talented, you can still participate in worship by singing along, clapping, or simply opening your heart to God's presence as we gather together in praise.</p>
        </div>
      `,
      author: "David Wilson",
      date: "2024-01-03",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=600&fit=crop",
      category: "Worship",
      likes: 27,
      excerpt: "Music has always been a powerful way to connect with God and express our faith. Discover the history and meaning behind our worship songs and how music ministry enriches our spiritual journey."
    },
    {
      id: "6",
      title: "Preparing for Easter: A Season of Reflection",
      content: `
        <div class="prose prose-lg max-w-none">
          <p>Easter is the cornerstone of the Christian faith—the celebration of Jesus' victory over death and the promise of eternal life for all who believe. But Easter isn't just a single day; it's the culmination of a season of preparation and reflection.</p>
          
          <p>The weeks leading up to Easter, known as Lent, provide an opportunity for us to examine our hearts, confess our sins, and recommit ourselves to following Christ.</p>
          
          <h2>The Journey of Lent</h2>
          
          <p>Lent is a 40-day period of spiritual preparation that mirrors Jesus' 40 days of fasting in the wilderness. During this time, many Christians choose to give up certain luxuries or habits as a form of spiritual discipline.</p>
          
          <p>However, Lent isn't just about giving things up—it's also about taking things on. Consider adding spiritual practices like daily Bible reading, extra prayer time, or acts of service to your routine.</p>
          
          <h2>Holy Week</h2>
          
          <p>The final week before Easter, known as Holy Week, takes us through the final days of Jesus' earthly ministry. From His triumphant entry into Jerusalem on Palm Sunday to His crucifixion on Good Friday to His resurrection on Easter Sunday, this week encapsulates the entire gospel message.</p>
          
          <p>We encourage you to participate in our Holy Week services, including our Maundy Thursday communion service and our Good Friday reflection service. These services help us enter into the story of Christ's passion in a deeper way.</p>
          
          <h2>Resurrection Sunday</h2>
          
          <p>Easter Sunday is a celebration like no other. It's a day when we proclaim with joy that death has been defeated and that we have hope for eternal life through Jesus Christ.</p>
          
          <p>Join us for our Easter celebration services as we worship the risen Savior together. It's a day of joy, hope, and renewed faith that reminds us why we call ourselves Christians.</p>
        </div>
      `,
      author: "Pastor John Smith",
      date: "2024-01-01",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1460904577954-8fadb262612c?w=1200&h=600&fit=crop",
      category: "Faith",
      likes: 41,
      excerpt: "As we approach the Easter season, it's time to prepare our hearts for reflection and renewal. Join us in exploring the significance of this holy time and how we can make the most of this spiritual journey."
    }
  ];

  // Find the specific post based on the ID from the URL
  const post = blogPosts.find(p => p.id === id);

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