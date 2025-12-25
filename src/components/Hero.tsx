import { Search, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-diverse-congregation.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (location) params.set("location", location);
    navigate(`/events${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <section className="relative min-h-[500px] sm:min-h-[550px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Church community gathering"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center py-10 sm:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6">
            Discover <span className="whitespace-nowrap">Churches, Charities</span> & Christian Events
          </h1>
          
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Find conferences, worship nights, and community gatherings near you
          </p>
          
          {/* Eventbrite-style Search Bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg p-2 shadow-2xl flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 border-b sm:border-b-0 sm:border-r border-border">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input 
                  type="text"
                  placeholder="Search events, keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 px-3 py-2">
                <MapPin className="h-5 w-5 text-muted-foreground shrink-0" />
                <Input 
                  type="text"
                  placeholder="City or location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-auto text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <Button 
                type="submit"
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 whitespace-nowrap"
              >
                <Search className="h-4 w-4 mr-2 sm:hidden" />
                <span className="hidden sm:inline">Find Events</span>
                <span className="sm:hidden">Search</span>
              </Button>
            </div>
          </form>

          {/* Quick Category Links */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 sm:gap-3">
            {["Conference", "Worship and Music", "Youth Events", "Bible Study", "Community Outreach"].map((category) => (
              <button
                key={category}
                onClick={() => navigate(`/events?category=${encodeURIComponent(category)}`)}
                className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white text-sm rounded-full hover:bg-white/20 transition-colors border border-white/20"
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent"></div>
    </section>
  );
};

export default Hero;
