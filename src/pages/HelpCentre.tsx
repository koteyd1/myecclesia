import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, BookOpen, Heart, Mail, Gift, MapPin, Clock, Search } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const HelpCentre = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Help Centre
          </h1>
          <p className="text-xl text-muted-foreground mb-4">
            Learn how to use all of MyEcclesia's features
          </p>
          <Badge variant="secondary" className="text-lg px-4 py-2">
            100% Free Platform
          </Badge>
        </div>

        {/* Quick Features Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Events & Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Discover and manage church events, add them to your personal calendar
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Blog & Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Read inspiring articles and spiritual content from the community
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
                Connect with your church community and stay updated
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
            <AccordionItem value="events">
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold">Events & Calendar</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="pl-8">
                  <h3 className="font-semibold mb-2">Browsing Events</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Visit the "Events" page to see all upcoming events</li>
                    <li>• Use filters to find events by category, date, or location</li>
                    <li>• Click on any event to see detailed information</li>
                    <li>• View events on the interactive map</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Event Registration</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Click "Register" on any event page</li>
                    <li>• Fill in required information</li>
                    <li>• Check for any special requirements</li>
                    <li>• Receive confirmation email</li>
                  </ul>
                  
                  <h3 className="font-semibold mt-6 mb-2">Personal Calendar</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Add events to your personal calendar</li>
                    <li>• Set reminders for important events</li>
                    <li>• Export calendar to your phone or email app</li>
                    <li>• View calendar in different formats (month, week, day)</li>
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
                  
                  <h3 className="font-semibold mb-2">Free Forever</h3>
                  <p className="text-muted-foreground mb-4">
                    Our commitment is to keep this platform completely free. We're supported by 
                    donations from users who believe in our mission to connect faith communities.
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
      
      <Footer />
    </div>
  );
};

export default HelpCentre;