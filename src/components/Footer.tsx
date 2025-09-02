import { useNavigate, Link } from "react-router-dom";
import { NewsletterSignup } from "@/components/NewsletterSignup";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-foreground text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
                  to="/events/christmas-carol-service-2024"
                  className="hover:text-primary transition-colors"
                >
                  Christmas Carol Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/events/new-year-prayer-meeting-2025"
                  className="hover:text-primary transition-colors"
                >
                  New Year Prayer Meeting
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
            <h4 className="font-semibold mb-4">Blog Articles</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <Link 
                  to="/blog/finding-hope-in-difficult-times"
                  className="hover:text-primary transition-colors"
                >
                  Finding Hope in Difficult Times
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog/the-power-of-community-service"
                  className="hover:text-primary transition-colors"
                >
                  The Power of Community Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog/youth-ministry-nurturing-the-next-generation"
                  className="hover:text-primary transition-colors"
                >
                  Youth Ministry
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog/building-strong-family-foundations"
                  className="hover:text-primary transition-colors"
                >
                  Building Strong Family Foundations
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <NewsletterSignup variant="footer" />
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-gray-300">
            <p>&copy; 2025 MyEcclesia. All rights reserved.</p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Link to="/sitemap" className="hover:text-primary transition-colors text-sm">
                Sitemap
              </Link>
              <span>|</span>
              <a href="/robots.txt" className="hover:text-primary transition-colors text-sm">
                Robots.txt
              </a>
              <span>|</span>
              <Link to="/privacy-policy" className="hover:text-primary transition-colors text-sm">
                Privacy
              </Link>
              <span>|</span>
              <Link to="/terms-and-conditions" className="hover:text-primary transition-colors text-sm">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;