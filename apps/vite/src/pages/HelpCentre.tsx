import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen, Heart, Mail, Gift, MapPin, Clock, Search, Ticket, Briefcase, Plus, CheckCircle } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const HelpCentre = () => {
  return (
    <>
      <SEOHead
        title="Help Centre | MyEcclesia"
        description="Get help using MyEcclesia. Learn how to find events, create profiles, register for church activities, and connect with the Christian community."
        keywords="MyEcclesia help, church app support, how to use MyEcclesia, FAQ"
      />
      <div className="min-h-screen bg-background">
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Help Centre
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Learn how to use all of MyEcclesia's features
          </p>
        </div>

        {/* Quick Features Overview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Events & Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Discover events, purchase tickets, and manage your bookings
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Create Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Host your own events and reach the Christian community
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-primary" />
                Opportunities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Find faith-based service opportunities and ministry positions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Community
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect with churches, kingdom leaders, and organizations
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Help Sections */}
        <div className="max-w-4xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            
            {/* Getting Started */}
            <AccordionItem value="getting-started">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Getting Started</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Creating Your Account</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Click "Login" in the top right corner</li>
                    <li>• Choose to sign up with email or social login</li>
                    <li>• Verify your email address</li>
                    <li>• Complete your profile information</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Dashboard Overview</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• View your registered events</li>
                    <li>• Manage your personal calendar</li>
                    <li>• Access your event history</li>
                    <li>• Update your profile settings</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Events */}
            <AccordionItem value="profiles">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Understanding Profile Types
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Personal Profile
                    </h4>
                    <p className="text-muted-foreground mb-2">
                      Your basic user account with personal information like name, email, and profile picture.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Basic identity and account management<br/>
                      <strong>Who can see it:</strong> Only you (private)<br/>
                      <strong>Features:</strong> Profile picture, contact info, account settings
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Kingdom Leader Profile
                    </h4>
                    <p className="text-muted-foreground mb-2">
                      A public profile for individual kingdom leaders, speakers, worship leaders, and spiritual guides.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Showcase your ministry and connect with others<br/>
                      <strong>Who can see it:</strong> Public (after admin verification)<br/>
                      <strong>Features:</strong> Ministry focus, mission statement, services offered, social links, booking contacts, follower system<br/>
                       <strong>Examples:</strong> Guest preachers, worship leaders, youth ministers, counselors, online devotional creators
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Organization Profile
                    </h4>
                    <p className="text-muted-foreground mb-2">
                      A public profile for churches, ministries, charities, and faith-based organizations.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <strong>Purpose:</strong> Represent your church or ministry online<br/>
                      <strong>Who can see it:</strong> Public (after admin verification)<br/>
                      <strong>Features:</strong> Mission statement, services offered, contact details, social media, events, follower system<br/>
                      <strong>Examples:</strong> Local churches, charities, food banks, youth organizations, prayer groups
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">👥 Can I have multiple profiles?</h5>
                    <p className="text-sm text-muted-foreground">
                      Yes! You can create both a Kingdom Leader profile and an Organization profile. For example, 
                      a pastor might have both a personal Kingdom Leader profile and represent their church with 
                      an Organization profile.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">✅ Verification Process</h5>
                    <p className="text-sm text-muted-foreground">
                       Kingdom Leader and Organization profiles require admin verification before going public. 
                      Similarly, all events require verification before becoming publicly visible.
                      This ensures authenticity and maintains trust in our community.
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="events">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Events & Tickets</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Browsing Events</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Visit the "Events" page to see all upcoming verified events</li>
                    <li>• Use filters to find events by category, date, or location</li>
                    <li>• Browse by category or location on the homepage</li>
                    <li>• Click on any event to see detailed information</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Purchasing Tickets</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• View available ticket types and prices on event pages</li>
                    <li>• Select your ticket quantity and complete payment</li>
                    <li>• Free events allow instant registration</li>
                    <li>• Paid events are processed securely via Stripe</li>
                    <li>• Receive confirmation email with your ticket details</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Managing Your Tickets</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• View all your tickets in "My Tickets" from your dashboard</li>
                    <li>• Each ticket has a unique QR code for check-in</li>
                    <li>• Add events to your personal calendar</li>
                    <li>• Save events to access later</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Creating Events */}
            <AccordionItem value="creating-events">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Plus className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Creating Events</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Who Can Create Events?</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Any registered user can create events</li>
                    <li>• You don't need a verified organization or kingdom leader profile</li>
                    <li>• Go to "My Profiles" in your dashboard to access event creation</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Event Verification Process</h3>
                  <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg mb-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>⚠️ Important:</strong> All events require admin verification before they become publicly visible. 
                      This ensures quality and authenticity of events on our platform.
                    </p>
                  </div>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Submit your event with complete details</li>
                    <li>• Your event will show as "Pending Verification"</li>
                    <li>• Our team will review and verify your event</li>
                    <li>• Once verified, your event becomes publicly visible</li>
                    <li>• You can view and edit your events anytime in "My Profiles"</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Event Details to Include</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Clear title and description</li>
                    <li>• Date, time, and duration</li>
                    <li>• Location with full address</li>
                    <li>• Category and denomination (if applicable)</li>
                    <li>• Ticket types and pricing</li>
                    <li>• Event image (recommended)</li>
                  </ul>

                  <h3 className="font-semibold mt-6 mb-2">Selling Tickets</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Set up Stripe Connect to receive payments</li>
                    <li>• Create multiple ticket types (e.g., Early Bird, Standard, VIP)</li>
                    <li>• Set prices, quantities, and sale dates</li>
                    <li>• Track ticket sales and check in attendees</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Opportunities */}
            <AccordionItem value="opportunities">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Faith Based Services</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Finding Faith Based Services</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Browse jobs, volunteer roles, and internships</li>
                    <li>• Filter by type, location, and remote availability</li>
                    <li>• View opportunities from verified organizations and kingdom leaders</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Applying for Faith Based Services</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Click on any opportunity to view full details</li>
                    <li>• Apply directly through the platform or via external link</li>
                    <li>• Track your applications in your dashboard</li>
                  </ul>
                  
                   <h3 className="font-semibold mt-6 mb-2">Posting Faith Based Services</h3>
                   <ul className="space-y-2 text-muted-foreground">
                     <li>• Verified organizations and kingdom leaders can post opportunities</li>
                    <li>• Include job description, requirements, and application method</li>
                    <li>• Manage applications from your dashboard</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Blog */}
            <AccordionItem value="blog">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Blog & Resources</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Reading Articles</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Browse latest articles on the Blog page</li>
                    <li>• Filter by categories like sermons, devotionals, community news</li>
                    <li>• Search for specific topics using the search bar</li>
                    <li>• Share articles with friends and family</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Staying Updated</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Subscribe to notifications for new posts</li>
                    <li>• Follow your favorite authors</li>
                    <li>• Save articles to read later</li>
                    <li>• Leave comments and engage with content</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Browsing & Discovery */}
            <AccordionItem value="browsing">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Browsing & Discovery</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">🔍 Browse Menu</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Use the "Browse" dropdown in the header to discover events, ministers, and organizations. 
                    Each section has powerful search and filtering options.
                  </p>
                  
                  <h3 className="font-semibold mb-2">📅 Events</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Find church services, conferences, workshops, and community events</li>
                    <li>• Filter by date, location, category, denomination, and price</li>
                    <li>• Register for events and add them to your calendar</li>
                    <li>• View event details and directions</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">👨‍💼 Ministers</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Discover speakers, worship leaders, and spiritual guides</li>
                    <li>• Search by ministry focus, location, or denomination</li>
                    <li>• Follow your favorites for updates</li>
                    <li>• Contact ministers for speaking engagements or mentoring</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">🏛️ Organizations</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Find churches, ministries, and faith-based organizations</li>
                    <li>• Filter by denomination, country, or mission focus</li>
                    <li>• Follow organizations to stay updated on their activities</li>
                    <li>• Discover local churches and community groups</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Features */}
            <AccordionItem value="features">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Platform Features</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Search & Discovery</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Use the search function to find specific events or content</li>
                    <li>• Filter results by date, location, or category</li>
                    <li>• Save your favorite searches</li>
                    <li>• Get recommendations based on your interests</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Notifications</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Receive email notifications for new events</li>
                    <li>• Get reminders for registered events</li>
                    <li>• Stay updated on blog posts and announcements</li>
                    <li>• Customize your notification preferences</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Map Integration</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• View events on an interactive map</li>
                    <li>• Get directions to event locations</li>
                    <li>• Filter events by geographic area</li>
                    <li>• Find nearby churches and events</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Support */}
            <AccordionItem value="support">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Support & Community</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Getting Help</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Contact us through the Contact page</li>
                    <li>• Join our community forums</li>
                    <li>• Check our FAQ section</li>
                    <li>• Report any technical issues</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Supporting the Platform</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• This platform is completely free to use</li>
                    <li>• Consider making a donation to support our mission</li>
                    <li>• Share the platform with your church community</li>
                    <li>• Provide feedback to help us improve</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* About */}
            <AccordionItem value="about">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">About MyEcclesia</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Our Mission</h3>
                  <p className="text-muted-foreground mb-4">
                    MyEcclesia is a free platform designed to help churches and religious communities 
                    connect, organize events, and strengthen their faith communities. We believe in 
                    making spiritual resources accessible to everyone.
                  </p>
                  
                  <h3 className="font-semibold mb-2">Privacy & Security</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Your data is protected and never sold</li>
                    <li>• Read our Privacy Policy for complete details</li>
                    <li>• Report any security concerns immediately</li>
                    <li>• We use industry-standard encryption</li>
                  </ul>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>

        {/* Contact Support */}
        <div className="mt-12 text-center bg-muted/30 rounded-lg p-8">
          <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Still Need Help?</h2>
          <p className="text-muted-foreground mb-4">
            Our support team is here to help you get the most out of MyEcclesia
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
          >
            <Mail className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </main>
      
    </div>
    </>
  );
};

export default HelpCentre;