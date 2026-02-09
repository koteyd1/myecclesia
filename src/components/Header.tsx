import { User, Settings, LogOut, ChevronDown, Briefcase, Ticket, ScanLine, LayoutDashboard, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Header = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [featuredBlogs, setFeaturedBlogs] = useState([]);

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        // Fetch the latest published blog posts (no admin restriction for header)
        const { data, error } = await supabase
          .from("blog_posts")
          .select("id, title, slug")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(2);

        if (error) throw error;
        setFeaturedBlogs(data || []);
      } catch (error) {
        console.error("Error fetching featured blogs:", error);
        setFeaturedBlogs([]);
      }
    };

    fetchFeaturedBlogs();
  }, []);

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
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  <span>Browse</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/events" className="w-full">
                      All Events
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/opportunities" className="w-full">
                      Jobs & Volunteering
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/ministers" className="w-full">
                      Ministers
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/organizations" className="w-full">
                      Organisations
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link to="/calendar" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
                Calendar
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors">
                  <span>Newsletter</span>
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem asChild>
                    <Link to="/blog" className="w-full">
                      All Articles
                    </Link>
                  </DropdownMenuItem>
                  {featuredBlogs.map((blog) => (
                    <DropdownMenuItem key={blog.id} asChild>
                      <Link to={`/blog/${blog.slug}`} className="w-full">
                        {blog.title.length > 25 ? `${blog.title.substring(0, 25)}...` : blog.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <Link to="/help-centre" className="w-full">
                      Help Centre
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/donate" className="w-full">
                      Donate
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Link 
              to="/dashboard" 
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Create Event
            </Link>
          </nav>

          {/* Mobile Navigation Toggle & Auth Buttons */}
          <div className="flex items-center space-x-3">
            
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
                  <DropdownMenuContent align="end" className="w-52 bg-popover border shadow-lg">
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                      {user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-tickets" className="flex items-center gap-2">
                        <Ticket className="h-4 w-4" />
                        Tickets
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/my-profiles" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        My Profiles
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/edit" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleAuthAction} className="flex items-center gap-2 text-destructive focus:text-destructive">
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
          <div className="py-3 flex items-center gap-3 text-sm overflow-x-auto scrollbar-hide px-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors whitespace-nowrap">
                <span>Browse</span>
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/events" className="w-full">All Events</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/opportunities" className="w-full">Jobs & Volunteering</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/ministers" className="w-full">Ministers</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/organizations" className="w-full">Organisations</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/calendar" className="text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Calendar
            </Link>
            <Link to="/blog" className="text-foreground hover:text-primary transition-colors whitespace-nowrap">
              Newsletter
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-primary transition-colors whitespace-nowrap">
                <span>More</span>
                <ChevronDown className="h-3 w-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/about" className="w-full">About</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="w-full">Contact</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/help-centre" className="w-full">Help Centre</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/donate" className="w-full">Donate</Link>
                </DropdownMenuItem>
                {user && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="w-full">Dashboard</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/dashboard" className="bg-primary text-primary-foreground px-3 py-1.5 rounded text-sm font-medium whitespace-nowrap ml-auto">
              Create Event
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;