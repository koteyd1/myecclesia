import { useNavigate, Link } from "react-router-dom";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Footer = () => {
  const navigate = useNavigate();
  const [featuredBlogs, setFeaturedBlogs] = useState([]);

  useEffect(() => {
    const fetchFeaturedBlogs = async () => {
      try {
        // Fetch the latest 4 published blog posts (no admin restriction for footer)
        const { data, error } = await supabase
          .from("blog_posts")
          .select("id, title, slug")
          .eq("published", true)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) throw error;
        setFeaturedBlogs(data || []);
      } catch (error) {
        console.error("Error fetching featured blogs:", error);
        setFeaturedBlogs([]);
      }
    };

    fetchFeaturedBlogs();
  }, []);

  return (
    <footer className="bg-foreground text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <div className="mb-4">
              <span className="text-lg font-bold">MyEcclesia</span>
            </div>
            <p className="text-gray-300">
              Bringing our church community together through meaningful events and shared experiences with MyEcclesia.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link 
                  to="/events"
                  className="hover:text-primary transition-colors"
                >
                  All Events
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog"
                  className="hover:text-primary transition-colors"
                >
                  Church Blog
                </Link>
              </li>
              <li>
                <Link 
                  to="/calendar"
                  className="hover:text-primary transition-colors"
                >
                  Event Calendar
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Latest Blog Articles</h4>
            <ul className="space-y-2 text-gray-300">
              {featuredBlogs.length > 0 ? (
                featuredBlogs.map((blog) => (
                  <li key={blog.id}>
                    <Link 
                      to={`/blog/${blog.slug}`}
                      className="hover:text-primary transition-colors"
                    >
                      {blog.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link 
                    to="/blog"
                    className="hover:text-primary transition-colors"
                  >
                    View All Blog Posts
                  </Link>
                </li>
              )}
            </ul>
          </div>
          
          <div>
            <NewsletterSignup variant="footer" />
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center text-gray-300 gap-4 sm:gap-0">
            <p>&copy; 2025 MyEcclesia. All rights reserved.</p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-4 sm:mt-0">
              <Link to="/sitemap" className="hover:text-primary transition-colors text-sm">
                Sitemap
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="/privacy-policy" className="hover:text-primary transition-colors text-sm">
                Privacy Policy
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="/terms-and-conditions" className="hover:text-primary transition-colors text-sm">
                Terms & Conditions
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="/cookie-policy" className="hover:text-primary transition-colors text-sm">
                Cookie Policy
              </Link>
              <span className="hidden sm:inline">|</span>
              <Link to="/contact" className="hover:text-primary transition-colors text-sm">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;