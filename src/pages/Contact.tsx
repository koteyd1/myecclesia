import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeInput, validateEmail, validateName, validatePhone, validateMessage, INPUT_LIMITS } from "@/utils/validation";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
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

      toast({
        title: "Message sent!",
        description: "Thank you for your message. We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
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
        <Header />
      
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
                <form onSubmit={handleSubmit} className="space-y-4">
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
                    />
                    <div className="text-sm text-muted-foreground text-right">
                      {formData.message.length}/{INPUT_LIMITS.MESSAGE_MAX}
                    </div>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
    </>
  );
};

export default Contact;