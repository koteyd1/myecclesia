import { Calendar, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">ChurchEvents</span>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Events
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              About
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;