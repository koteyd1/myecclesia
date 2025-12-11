import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Clock, Shield } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeInput, validateEmail, validateName, validatePhone, validateMessage, INPUT_LIMITS } from "@/utils/validation";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { useRateLimit } from "@/hooks/useRateLimit";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState(""); // Honeypot field for bot detection
  const formStartTime = useRef(Date.now()); // Track form fill time
  const { toast } = useToast();
  
  // Rate limiting: 3 submissions per 5 minutes
  const { isBlocked, checkRateLimit, recordAttempt, getRemainingTime, attemptsRemaining } = useRateLimit({
    maxAttempts: 3,
    windowMs: 5 * 60 * 1000 // 5 minutes
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    // Check honeypot - if filled, it's likely a bot
    if (honeypot) {
      console.log('Bot detected via honeypot');
      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      return; // Silently fail for bots
    }
    
    // Check if form was filled too quickly (less than 3 seconds = likely bot)
    const fillTime = Date.now() - formStartTime.current;
    if (fillTime < 3000) {
      console.log('Bot detected via timing');
      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      return; // Silently fail for bots
    }
    
    // Check rate limit
    if (!checkRateLimit()) {
      toast({
        variant: "destructive",
        title: "Rate Limit Exceeded",
        description: `Too many submissions. Please wait ${getRemainingTime()} seconds before trying again.`,
      });
      return;
    }
    
    setIsSubmitting(true);
    recordAttempt();
    
    try {
      // Comprehensive validation using utility functions
      const sanitizedName = sanitizeInput(formData.name, INPUT_LIMITS.NAME_MAX);
      const sanitizedEmail = sanitizeInput(formData.email, INPUT_LIMITS.EMAIL_MAX);
      const sanitizedPhone = sanitizeInput(formData.phone, INPUT_LIMITS.PHONE_MAX);
      const sanitizedMessage = sanitizeInput(formData.message, INPUT_LIMITS.MESSAGE_MAX);
      
      // Validate name
      if (!validateName(sanitizedName)) {
        toast({
          variant: "destructive",
          title: "Invalid Name",
          description: "Please enter a valid name (letters, spaces, hyphens, and apostrophes only).",
        });
        return;
      }
      
      // Validate email
      if (!validateEmail(sanitizedEmail)) {
        toast({
          variant: "destructive",
          title: "Invalid Email", 
          description: "Please enter a valid email address.",
        });
        return;
      }
      
      // Validate phone (optional field)
      if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
        toast({
          variant: "destructive",
          title: "Invalid Phone",
          description: "Please enter a valid phone number.",
        });
        return;
      }
      
      // Validate message
      if (!validateMessage(sanitizedMessage)) {
        toast({
          variant: "destructive",
          title: "Invalid Message",
          description: `Message must be less than ${INPUT_LIMITS.MESSAGE_MAX} characters.`,
        });
        return;
      }
      
      if (!sanitizedMessage.trim()) {
        toast({
          variant: "destructive",
          title: "Message Required",
          description: "Please enter a message.",
        });
        return;
      }

      // Save to database with sanitized data
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: sanitizedName,
          email: sanitizedEmail,
          phone: sanitizedPhone || null,
          message: sanitizedMessage
        });

      if (error) {
        console.error('Database error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Database error: ${error.message}`,
        });
        return;
      }

      // Send email notification
      try {
        const { error: emailError } = await supabase.functions.invoke('send-contact-notification', {
          body: {
            type: 'contact',
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            message: sanitizedMessage
          }
        });

        if (emailError) {
          console.error('Email notification error:', emailError);
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
      formStartTime.current = Date.now(); // Reset timer
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Contact page schema
  const contactSchema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "name": "Contact MyEcclesia",
    "description": "Get in touch with MyEcclesia for questions, support, or partnership opportunities",
    "url": "https://myecclesia.com/contact",
    "mainEntity": {
      "@type": "Organization",
      "name": "MyEcclesia",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "English"
      }
    }
  };

  return (
    <>
      <SEOHead 
        title="Contact MyEcclesia – Get in Touch | Christian Events Platform"
        description="Contact MyEcclesia for questions about Christian events, partnership opportunities, or support. We're here to help connect the UK Christian community."
        keywords="contact MyEcclesia, Christian events support, partnership opportunities, church event platform contact"
        canonicalUrl="https://myecclesia.com/contact"
      />
      <div className="min-h-screen bg-background">
        <StructuredData data={contactSchema} />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BreadcrumbNav />
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Contact MyEcclesia</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We'd love to hear from you! Reach out to us with any questions, prayer requests, or if you'd like to get involved.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isBlocked && (
                  <Alert variant="destructive" className="mb-4">
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                      Rate limit exceeded. Please wait {getRemainingTime()} seconds before submitting again.
                    </AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field - hidden from users, visible to bots */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      name="website"
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(e) => setHoneypot(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.NAME_MAX}
                      required
                      disabled={isBlocked}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.EMAIL_MAX}
                      required
                      disabled={isBlocked}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="07700 900000"
                      value={formData.phone}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.PHONE_MAX}
                      disabled={isBlocked}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={INPUT_LIMITS.MESSAGE_MAX}
                      rows={5}
                      required
                      disabled={isBlocked}
                    />
                    <div className="text-sm text-muted-foreground text-right">
                      {formData.message.length}/{INPUT_LIMITS.MESSAGE_MAX}
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting || isBlocked}>
                    {isSubmitting ? "Sending..." : isBlocked ? `Wait ${getRemainingTime()}s` : "Send Message"}
                  </Button>
                  
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Shield className="h-3 w-3" />
                    <span>{attemptsRemaining} submissions remaining</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Help Centre CTA */}
        <section className="mt-12">
          <Card className="max-w-2xl mx-auto bg-primary/5 border-primary/20">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Need Quick Answers?</CardTitle>
              <CardDescription>
                Check out our Help Centre for frequently asked questions and guides on using MyEcclesia.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button asChild variant="outline">
                <a href="/help-centre">Visit Help Centre</a>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
    </>
  );
};

export default Contact;