import { useState, useEffect } from "react";
import { X, Users, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface SignupPromptProps {
  delayMs?: number;
}

export const SignupPrompt = ({ delayMs = 5000 }: SignupPromptProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    // Don't show if user is logged in
    if (user) return;

    // Check if user has dismissed the popup recently (within 7 days)
    const lastDismissed = localStorage.getItem("signupPromptDismissed");
    if (lastDismissed) {
      const dismissedDate = new Date(lastDismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Show popup after delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [user, delayMs]);

  const handleClose = () => {
    setIsClosing(true);
    localStorage.setItem("signupPromptDismissed", new Date().toISOString());
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleSignup = () => {
    handleClose();
    navigate("/auth?mode=signup");
  };

  const handleLogin = () => {
    handleClose();
    navigate("/auth");
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
      onClick={handleClose}
    >
      <div 
        className={`relative bg-gradient-to-br from-primary/5 via-background to-primary/10 border border-primary/20 rounded-2xl shadow-2xl max-w-md w-full p-8 transition-all duration-300 ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Users className="h-10 w-10 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-accent flex items-center justify-center animate-bounce">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">
            Join Our Growing Community
          </h2>
          
          <p className="text-muted-foreground">
            Be part of <span className="font-semibold text-primary">thousands of Christians</span> discovering and attending faith-based events across the UK.
          </p>

          {/* Benefits */}
          <div className="flex flex-wrap justify-center gap-3 py-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Heart className="h-4 w-4 text-destructive" />
              <span>Save Events</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4 text-primary" />
              <span>Connect</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-accent-foreground" />
              <span>Get Recommendations</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleSignup}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              Sign Up Free
            </Button>
            <Button 
              onClick={handleLogin}
              variant="ghost"
              className="w-full"
            >
              Already have an account? <span className="font-semibold ml-1">Log in</span>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground pt-2">
            It's completely free to join. No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
};
