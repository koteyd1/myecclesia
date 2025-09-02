import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { sanitizeInput, validateEmail, validateName, validatePhone, validateMessage, INPUT_LIMITS } from "@/utils/validation";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { StructuredData } from "@/components/StructuredData";
import { BreadcrumbNav } from "@/components/BreadcrumbNav";
import { Users, Calendar, Heart, Star, ChevronRight, CheckCircle, Church, Globe } from "lucide-react";

const Partnership = () => {
  const [formData, setFormData] = useState({
    organizationName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    organizationType: "",
    denomination: "",
    location: "",
    estimatedEvents: "",
    partnershipInterest: [] as string[],
    experience: "",
    message: "",
    agreedToTerms: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const organizationTypes = [
    "Church",
    "Ministry Organization",
    "Christian Non-Profit",
    "Event Management Company", 
    "Conference Organizer",
    "Worship Band/Artist",
    "Christian Business",
    "Educational Institution",
    "Other"
  ];

  const partnershipOptions = [
    "Event hosting and ticketing",
    "Marketing and promotion support",
    "Technical integration assistance",
    "Community building initiatives",
    "Joint event planning",
    "Resource sharing",
    "Training and workshops"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Comprehensive validation
      const sanitizedName = sanitizeInput(formData.contactName, INPUT_LIMITS.NAME_MAX);
      const sanitizedEmail = sanitizeInput(formData.email, INPUT_LIMITS.EMAIL_MAX);
      const sanitizedPhone = sanitizeInput(formData.phone, INPUT_LIMITS.PHONE_MAX);
      const sanitizedMessage = sanitizeInput(formData.message, INPUT_LIMITS.MESSAGE_MAX);
      const sanitizedOrgName = sanitizeInput(formData.organizationName, 200);
      
      // Validate required fields
      if (!validateName(sanitizedName)) {
        toast({
          variant: "destructive",
          title: "Invalid Contact Name",
          description: "Please enter a valid contact name.",
        });
        return;
      }
      
      if (!validateEmail(sanitizedEmail)) {
        toast({
          variant: "destructive",
          title: "Invalid Email", 
          description: "Please enter a valid email address.",
        });
        return;
      }
      
      if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
        toast({
          variant: "destructive",
          title: "Invalid Phone",
          description: "Please enter a valid phone number.",
        });
        return;
      }
      
      if (!sanitizedOrgName.trim()) {
        toast({
          variant: "destructive",
          title: "Organization Name Required",
          description: "Please enter your organization name.",
        });
        return;
      }
      
      if (!formData.organizationType) {
        toast({
          variant: "destructive",
          title: "Organization Type Required",
          description: "Please select your organization type.",
        });
        return;
      }
      
      if (!formData.agreedToTerms) {
        toast({
          variant: "destructive",
          title: "Terms Agreement Required",
          description: "Please agree to the terms and conditions.",
        });
        return;
      }

      // Save to contact_messages table with partnership flag
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: `${sanitizedOrgName} (${sanitizedName})`,
          email: sanitizedEmail,
          phone: sanitizedPhone || null,
          message: `
PARTNERSHIP INQUIRY

Organization: ${sanitizedOrgName}
Contact Person: ${sanitizedName}
Organization Type: ${formData.organizationType}
Denomination: ${formData.denomination || 'Not specified'}
Location: ${formData.location || 'Not specified'}
Website: ${formData.website || 'Not provided'}
Estimated Annual Events: ${formData.estimatedEvents || 'Not specified'}

Partnership Interests:
${formData.partnershipInterest.join(', ') || 'None specified'}

Experience with Event Management:
${formData.experience || 'Not provided'}

Additional Message:
${sanitizedMessage || 'None provided'}
          `.trim()
        });

      if (error) {
        console.error('Database error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit partnership inquiry. Please try again.",
        });
        return;
      }

      // Send email notification
      try {
        const { error: emailError } = await supabase.functions.invoke('send-contact-notification', {
          body: {
            type: 'partnership',
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            message: sanitizedMessage || 'Partnership application submitted.',
            organizationName: sanitizedOrgName,
            organizationType: formData.organizationType,
            partnershipDetails: {
              denomination: formData.denomination,
              location: formData.location,
              website: formData.website,
              estimatedEvents: formData.estimatedEvents,
              partnershipInterest: formData.partnershipInterest,
              experience: formData.experience
            }
          }
        });

        if (emailError) {
          console.error('Email notification error:', emailError);
          // Don't fail the form submission if email fails, just log it
        }
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Don't fail the form submission if email fails
      }

      toast({
        title: "Partnership Inquiry Submitted!",
        description: "Thank you for your interest in partnering with us. We'll get back to you within 2 business days.",
      });
      
      // Reset form
      setFormData({
        organizationName: "",
        contactName: "",
        email: "",
        phone: "",
        website: "",
        organizationType: "",
        denomination: "",
        location: "",
        estimatedEvents: "",
        partnershipInterest: [],
        experience: "",
        message: "",
        agreedToTerms: false
      });
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

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePartnershipInterestChange = (option: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      partnershipInterest: checked 
        ? [...prev.partnershipInterest, option]
        : prev.partnershipInterest.filter(item => item !== option)
    }));
  };

  // Partnership schema for SEO
  const partnershipSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Partner with MyEcclesia",
    "description": "Join MyEcclesia as a partner to grow your Christian community and expand your event reach across the UK",
    "url": "https://myecclesia.com/partnership",
    "mainEntity": {
      "@type": "Organization",
      "name": "MyEcclesia",
      "description": "Christian events platform seeking church and ministry partnerships",
      "offers": {
        "@type": "Offer",
        "description": "Partnership opportunities for churches and Christian organizations"
      }
    }
  };

  return (
    <>
      <SEOHead 
        title="Partner with MyEcclesia – Church & Ministry Partnerships | Event Platform"
        description="Join MyEcclesia as a partner! Churches and ministries can expand their reach, grow their community, and streamline event management. Apply for partnership today."
        keywords="MyEcclesia partnership, church partnership, ministry partnership, Christian event platform, church event management, ministry collaboration"
        canonicalUrl="https://myecclesia.com/partnership"
      />
      <div className="min-h-screen bg-background">
        <StructuredData data={partnershipSchema} />
        
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <BreadcrumbNav customItems={[
            { label: 'Home', href: '/' },
            { label: 'Contact', href: '/contact' },
            { label: 'Partnership' }
          ]} />
          
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">Partner with MyEcclesia</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Join us in connecting the UK Christian community. Partner with MyEcclesia to expand your reach, 
              grow your ministry, and bring believers together through meaningful events.
            </p>
          </div>

          {/* Partnership Benefits */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground text-center mb-8">Why Partner with Us?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Users className="h-12 w-12 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">Expand Your Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Connect with thousands of Christians across the UK and grow your community beyond geographical boundaries.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Calendar className="h-12 w-12 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">Event Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Streamline your event planning with our comprehensive ticketing and management platform.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Heart className="h-12 w-12 text-success mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">Community Building</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Foster deeper relationships and stronger faith communities through shared experiences and events.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="text-center group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Star className="h-12 w-12 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <CardTitle className="text-lg">Marketing Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Benefit from our marketing expertise and platform reach to promote your events effectively.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Partnership Types */}
          <section className="mb-16">
            <h2 className="text-3xl font-semibold text-foreground text-center mb-8">Partnership Opportunities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Church className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Church Partnership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Free event listing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Basic ticketing support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Community access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Marketing resources</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow border-primary">
                <CardHeader>
                  <Globe className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Ministry Partnership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Priority event placement</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Advanced analytics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Custom branding options</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Dedicated support</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="group hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Star className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Strategic Partnership</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Co-marketing opportunities</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Revenue sharing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Technical integration</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">Strategic planning support</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Partnership Form */}
          <section className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Partnership Application</CardTitle>
                <CardDescription>
                  Fill out the form below to express your interest in partnering with MyEcclesia.
                  We'll review your application and get back to you within 2 business days.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizationName">Organization Name *</Label>
                      <Input
                        id="organizationName"
                        placeholder="Your church or organization name"
                        value={formData.organizationName}
                        onChange={(e) => handleChange('organizationName', e.target.value)}
                        maxLength={200}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Person *</Label>
                      <Input
                        id="contactName"
                        placeholder="Your full name"
                        value={formData.contactName}
                        onChange={(e) => handleChange('contactName', e.target.value)}
                        maxLength={INPUT_LIMITS.NAME_MAX}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        maxLength={INPUT_LIMITS.EMAIL_MAX}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="07700 900000"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        maxLength={INPUT_LIMITS.PHONE_MAX}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="organizationType">Organization Type *</Label>
                      <Select value={formData.organizationType} onValueChange={(value) => handleChange('organizationType', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                        <SelectContent>
                          {organizationTypes.map(type => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="denomination">Denomination</Label>
                      <Input
                        id="denomination"
                        placeholder="e.g., Baptist, Methodist, Non-denominational"
                        value={formData.denomination}
                        onChange={(e) => handleChange('denomination', e.target.value)}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        placeholder="City, Region, UK"
                        value={formData.location}
                        onChange={(e) => handleChange('location', e.target.value)}
                        maxLength={150}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        type="url"
                        placeholder="https://yourchurch.com"
                        value={formData.website}
                        onChange={(e) => handleChange('website', e.target.value)}
                        maxLength={200}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimatedEvents">Estimated Annual Events</Label>
                    <Select value={formData.estimatedEvents} onValueChange={(value) => handleChange('estimatedEvents', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="How many events do you organize per year?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1-5 events</SelectItem>
                        <SelectItem value="6-12">6-12 events</SelectItem>
                        <SelectItem value="13-25">13-25 events</SelectItem>
                        <SelectItem value="26-50">26-50 events</SelectItem>
                        <SelectItem value="50+">50+ events</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Partnership Interests (select all that apply)</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {partnershipOptions.map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={option}
                            checked={formData.partnershipInterest.includes(option)}
                            onCheckedChange={(checked) => handlePartnershipInterestChange(option, !!checked)}
                          />
                          <Label htmlFor={option} className="text-sm">{option}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Experience with Event Management</Label>
                    <Textarea
                      id="experience"
                      placeholder="Tell us about your experience organizing events, current challenges, and what tools you currently use..."
                      value={formData.experience}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      maxLength={500}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Any additional information about your organization or partnership goals..."
                      value={formData.message}
                      onChange={(e) => handleChange('message', e.target.value)}
                      maxLength={INPUT_LIMITS.MESSAGE_MAX}
                      rows={4}
                    />
                    <div className="text-sm text-muted-foreground text-right">
                      {formData.message.length}/{INPUT_LIMITS.MESSAGE_MAX}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => handleChange('agreedToTerms', !!checked)}
                      required
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I agree to the{" "}
                      <a href="/terms-and-conditions" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a href="/privacy-policy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                      </a>
                      . *
                    </Label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting Application..." : "Submit Partnership Application"}
                    {!isSubmitting && <ChevronRight className="ml-2 h-4 w-4" />}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </section>

          {/* Contact Information */}
          <section className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Questions About Partnership?</CardTitle>
                <CardDescription>
                  Our partnership team is here to help you understand how MyEcclesia can support your ministry goals.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  For immediate questions or to schedule a consultation, please contact us directly.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button variant="outline" asChild>
                    <a href="/contact">General Contact</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/help-centre">Help Centre</a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </>
  );
};

export default Partnership;