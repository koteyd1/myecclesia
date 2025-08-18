import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
              <img 
                src="/lovable-uploads/0d3d2918-a9f2-480a-ab92-4a5c6554877d.png" 
                alt="MyEcclesia Logo" 
                className="h-10 w-10 object-contain"
              />
              <span className="text-xl font-bold text-foreground">MyEcclesia</span>
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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  <span>Contact</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/contact" className="w-full">
                      Contact Us
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/partnership" className="w-full">
                      Partner with Us
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/help-centre" className="w-full">
                      Help Centre
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
            
            {/* Profile Dropdown for authenticated users */}
            {user ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">Account</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/my-profiles" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Profiles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/edit" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Edit Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleAuthAction} className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button onClick={handleAuthAction} variant="outline" size="sm">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sign In</span>
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
            <Link to="/partnership" className="text-foreground hover:text-primary transition-colors">
              Partner with Us
            </Link>
            <Link to="/help-centre" className="text-foreground hover:text-primary transition-colors">
              Help Centre
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