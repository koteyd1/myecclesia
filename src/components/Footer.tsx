import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();

  return (
    <footer className="bg-foreground text-white py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img 
                src="/lovable-uploads/0d3d2918-a9f2-480a-ab92-4a5c6554877d.png" 
                alt="MyEcclesia Logo" 
                className="h-8 w-8 object-contain"
              />
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
                  onClick={() => navigate("/event-guidelines")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Event Guidelines
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/privacy-policy")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/terms-and-conditions")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Terms & Conditions
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-gray-300">
              <li>
                <button 
                  onClick={() => navigate("/events")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Worship Services
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/events")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Fellowship
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/events")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Community Events
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate("/events")}
                  className="hover:text-primary transition-colors text-left"
                >
                  Education
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Denominations</h4>
            <ul className="space-y-2 text-gray-300">
              <li>Baptist</li>
              <li>Methodist</li>
              <li>Catholic</li>
              <li>Presbyterian</li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2024 MyEcclesia. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;