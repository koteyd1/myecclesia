import { Calendar, User, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate("/auth");
    }
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm border-b border-border sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => navigate("/")}
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <Calendar className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">ChurchEvents</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-6 ml-16">
            <div className="flex items-center space-x-6 border-r border-border pr-6">
              <Link to="/events" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Events
              </Link>
              <Link to="/calendar" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Calendar
              </Link>
              <Link to="/blog" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Blog
              </Link>
            </div>
            
            <div className="flex items-center space-x-6 border-r border-border pr-6">
              <Link to="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
            
            <Link 
              to="/donate" 
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Donate
            </Link>
          </nav>

          {/* Mobile Navigation Toggle & Auth Buttons */}
          <div className="flex items-center space-x-3">
            {/* Dashboard link for authenticated users */}
            {user && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="hidden md:flex">
                Dashboard
              </Button>
            )}
            
            {/* Auth Button */}
            <Button variant="ghost" size="sm" onClick={handleAuthAction}>
              {user ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sign Out</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </>
              )}
            </Button>
            
            {/* Admin Button */}
            {user && isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Admin</span>
              </Button>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-border">
          <div className="py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link to="/events" className="text-foreground hover:text-primary transition-colors">
              Events
            </Link>
            <Link to="/calendar" className="text-foreground hover:text-primary transition-colors">
              Calendar
            </Link>
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors">
              Blog
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <Link to="/donate" className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium">
              Donate
            </Link>
            {user && (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;