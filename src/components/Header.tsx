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
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/events" className="text-foreground hover:text-primary transition-colors">
              Events
            </Link>
            <Link to="/calendar" className="text-foreground hover:text-primary transition-colors">
              Calendar
            </Link>
            {user && (
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
            )}
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors">
              Blog
            </Link>
            <Link to="/about" className="text-foreground hover:text-primary transition-colors">
              About
            </Link>
            <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
              Contact
            </Link>
            <Link to="/donate" className="text-foreground hover:text-primary transition-colors">
              Donate
            </Link>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleAuthAction}>
              {user ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </>
              ) : (
                <>
                  <User className="h-4 w-4 mr-2" />
                  Login
                </>
              )}
            </Button>
            {user && isAdmin && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/admin")}
              >
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;