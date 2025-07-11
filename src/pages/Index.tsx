import Header from "@/components/Header";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Heart, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

// Sample events data
const sampleEvents = [
  {
    id: "1",
    title: "Sunday Worship Service",
    date: "2024-01-21",
    time: "10:00 AM",
    location: "Main Sanctuary",
    description: "Join us for our weekly worship service featuring inspiring music, prayer, and a message of hope.",
    image: "https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800&h=400&fit=crop",
    price: 0,
    availableTickets: 150,
    category: "Worship"
  },
  {
    id: "2", 
    title: "Youth Fellowship Night",
    date: "2024-01-26",
    time: "7:00 PM",
    location: "Youth Center",
    description: "An evening of games, discussion, and fellowship for teens and young adults.",
    image: "https://images.unsplash.com/photo-1529390079861-591de354faf5?w=800&h=400&fit=crop",
    price: 5,
    availableTickets: 50,
    category: "Fellowship"
  },
  {
    id: "3",
    title: "Community Dinner",
    date: "2024-02-02",
    time: "6:30 PM", 
    location: "Fellowship Hall",
    description: "A monthly community dinner bringing together families for food and fellowship.",
    image: "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=400&fit=crop",
    price: 10,
    availableTickets: 80,
    category: "Community"
  },
  {
    id: "4",
    title: "Bible Study Workshop",
    date: "2024-02-08",
    time: "7:00 PM",
    location: "Conference Room",
    description: "Deep dive into scripture with guided discussion and study materials provided.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=400&fit=crop",
    price: 0,
    availableTickets: 25,
    category: "Education"
  },
  {
    id: "5",
    title: "Easter Celebration Service",
    date: "2024-03-31",
    time: "9:00 AM",
    location: "Main Sanctuary",
    description: "Celebrate the resurrection with special music, baptisms, and a message of new life.",
    image: "https://images.unsplash.com/photo-1460904577954-8fadb262612c?w=800&h=400&fit=crop",
    price: 0,
    availableTickets: 200,
    category: "Special Event"
  },
  {
    id: "6",
    title: "Marriage Enrichment Retreat",
    date: "2024-04-15",
    time: "9:00 AM",
    location: "Mountain View Retreat Center",
    description: "A weekend retreat focused on strengthening marriages through workshops and prayer.",
    image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&h=400&fit=crop",
    price: 75,
    availableTickets: 30,
    category: "Retreat"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All Events");

  const categories = ["All Events", "Worship", "Fellowship", "Community", "Education", "Special Event", "Retreat"];

  const filteredEvents = selectedCategory === "All Events" 
    ? sampleEvents 
    : sampleEvents.filter(event => event.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      
      {/* Events Section */}
      <section id="events" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Upcoming Events
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join us for these upcoming events and be part of our growing community of faith.
            </p>
          </div>
          
          {/* Event Categories Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map((category) => (
              <Badge 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"} 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
          
          {/* Events Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} {...event} />
            ))}
          </div>
          
          <div className="text-center">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => navigate("/events")}
            >
              View All Events
            </Button>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 bg-muted">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Join Our Events?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the warmth of our community and grow in your faith journey.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Calendar className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Easy Registration</h3>
              <p className="text-muted-foreground">Simple, secure registration process for all events</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-secondary/20 transition-colors">
                <Users className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Community</h3>
              <p className="text-muted-foreground">Connect with fellow believers and build lasting friendships</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-success/20 transition-colors">
                <Heart className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Spiritual Growth</h3>
              <p className="text-muted-foreground">Deepen your faith through meaningful experiences</p>
            </div>
            
            <div className="text-center group">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Quality Events</h3>
              <p className="text-muted-foreground">Thoughtfully planned events for all ages and interests</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Calendar className="h-6 w-6 text-primary" />
                <span className="text-lg font-bold">ChurchEvents</span>
              </div>
              <p className="text-gray-300">
                Bringing our church community together through meaningful events and shared experiences.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button 
                    onClick={() => navigate("/events")}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Upcoming Events
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/blog")}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Church Blog
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigate("/contact")}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Contact Us
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Categories</h4>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <button 
                    onClick={() => {
                      setSelectedCategory("Worship");
                      document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Worship Services
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setSelectedCategory("Fellowship");
                      document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Fellowship
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setSelectedCategory("Community");
                      document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Community Events
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => {
                      setSelectedCategory("Education");
                      document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="hover:text-primary transition-colors text-left"
                  >
                    Education
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <div className="space-y-2 text-gray-300">
                <p>123 Church Street</p>
                <p>Your City, ST 12345</p>
                <p>(555) 123-4567</p>
                <p>events@church.org</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
            <p>&copy; 2024 ChurchEvents. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
