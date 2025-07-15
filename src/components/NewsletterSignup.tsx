import { useState } from 'react';
import { Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface NewsletterSignupProps {
  className?: string;
  variant?: 'default' | 'minimal' | 'footer';
}

export const NewsletterSignup = ({ 
  className = "",
  variant = 'default'
}: NewsletterSignupProps) => {
  const [email, setEmail] = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call - in real implementation, this would save to database
    setTimeout(() => {
      setIsSubscribed(true);
      setIsLoading(false);
      toast({
        title: "Successfully subscribed!",
        description: "Thank you for subscribing to our newsletter.",
      });
    }, 1000);
  };

  if (isSubscribed) {
    return (
      <div className={`text-center ${className}`}>
        <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Thank you for subscribing!
        </h3>
        <p className="text-sm text-muted-foreground">
          You'll receive updates about upcoming events and community news.
        </p>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className={`flex gap-2 ${className}`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "..." : "Subscribe"}
        </Button>
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <div className={className}>
        <h4 className="font-semibold mb-4 text-white">Stay Connected</h4>
        <p className="text-gray-300 mb-4 text-sm">
          Get updates about events, announcements, and community news.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
          <Button 
            type="submit" 
            disabled={isLoading}
            variant="secondary"
          >
            <Mail className="h-4 w-4" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Stay Connected</CardTitle>
        <CardDescription>
          Get updates about upcoming events, announcements, and community news delivered to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </CardContent>
    </Card>
  );
};