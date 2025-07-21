import { useState, useEffect } from "react";
import { Heart, PoundSterling, Users, Target, CreditCard, CalendarDays, Monitor, Lightbulb, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { sanitizeInput, validateEmail, validateName, validatePhone, INPUT_LIMITS } from "@/utils/validation";

const donationOptions = [
  { amount: 5, label: "£5", description: "Helps provide refreshments for community events" },
  { amount: 10, label: "£10", description: "Supports youth program activities" },
  { amount: 25, label: "£25", description: "Funds educational workshops and materials" },
  { amount: 50, label: "£50", description: "Sponsors a family retreat weekend" },
];

const Donate = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donationType, setDonationType] = useState<'one_time' | 'recurring'>('one_time');
  const [isLoading, setIsLoading] = useState(false);
  const [donorInfo, setDonorInfo] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount("");
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      toast({
        title: "Thank You!",
        description: "Your donation has been successfully processed.",
      });
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    if (canceled === 'true') {
      toast({
        title: "Payment Canceled",
        description: "Your payment was canceled. You can try again anytime.",
        variant: "destructive",
      });
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const donationAmount = selectedAmount || parseFloat(customAmount);
    
    if (!donationAmount || donationAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please select or enter a valid donation amount.",
        variant: "destructive",
      });
      return;
    }

    // Validate and sanitize donor information
    const sanitizedName = sanitizeInput(donorInfo.name, INPUT_LIMITS.NAME_MAX);
    const sanitizedEmail = sanitizeInput(donorInfo.email, INPUT_LIMITS.EMAIL_MAX);
    const sanitizedPhone = sanitizeInput(donorInfo.phone, INPUT_LIMITS.PHONE_MAX);
    const sanitizedMessage = sanitizeInput(donorInfo.message, INPUT_LIMITS.MESSAGE_MAX);

    if (!validateName(sanitizedName)) {
      toast({
        title: "Invalid Name",
        description: "Please enter a valid name.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(sanitizedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (sanitizedPhone && !validatePhone(sanitizedPhone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-donation-payment', {
        body: {
          amount: donationAmount,
          donationType: donationType,
          donorInfo: {
            name: sanitizedName,
            email: sanitizedEmail,
            phone: sanitizedPhone,
            message: sanitizedMessage
          },
          isAuthenticated: !!user
        }
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Payment Processing",
          description: "You'll be redirected to Stripe to complete your donation.",
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const finalAmount = selectedAmount || parseFloat(customAmount) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <Heart className="h-16 w-16 text-primary mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Support Our Mission
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Your generous donation helps us continue to serve our community, 
              support those in need, and spread love through meaningful events and programs.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Your Impact
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              See how your donation makes a difference in our community
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Community Events</h3>
              <p className="text-muted-foreground">
                Supporting community events annually, bringing believers together
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Outreach Programs</h3>
              <p className="text-muted-foreground">
                Supporting outreach programs and people less fortunate
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Youth Development</h3>
              <p className="text-muted-foreground">
                Supporting discipleship, development and growth opportunities for youth
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Monitor className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Website maintainence</h3>
              <p className="text-muted-foreground">
                Managing websites to maintain quality standarding and mitigate technical issues
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Lightbulb className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Initiatives and Developments</h3>
              <p className="text-muted-foreground">
                Supporting creative Initiatives that help to add value to the Body of Christ
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <UserCheck className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Supporting Staff</h3>
              <p className="text-muted-foreground">
                Supporting MyEcclesia and its workers who help to provide a great service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Donation Form */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Make a Donation</CardTitle>
                <CardDescription>
                  Choose an amount and select one-time or recurring donation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Donation Amount Selection */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Select Amount</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {donationOptions.map((option) => (
                        <Button
                          key={option.amount}
                          type="button"
                          variant={selectedAmount === option.amount ? "default" : "outline"}
                          className="h-12 p-3 flex items-center justify-center text-center"
                          onClick={() => handleAmountSelect(option.amount)}
                        >
                          <span className="text-lg font-bold">{option.label}</span>
                        </Button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="Enter custom amount"
                        value={customAmount}
                        onChange={(e) => handleCustomAmountChange(e.target.value)}
                        className="pl-10"
                        min="1"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Donation Type Selection */}
                  <div>
                    <Label className="text-base font-semibold mb-4 block">Donation Type</Label>
                    <RadioGroup value={donationType} onValueChange={(value) => setDonationType(value as 'one_time' | 'recurring')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="one_time" id="one_time" />
                        <Label htmlFor="one_time" className="flex items-center cursor-pointer">
                          <CreditCard className="h-4 w-4 mr-2 text-primary" />
                          One-time donation
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="recurring" id="recurring" />
                        <Label htmlFor="recurring" className="flex items-center cursor-pointer">
                          <CalendarDays className="h-4 w-4 mr-2 text-primary" />
                          Monthly recurring donation
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Donor Information */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Donor Information</Label>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          value={donorInfo.name}
                          onChange={(e) => setDonorInfo({...donorInfo, name: e.target.value})}
                          maxLength={INPUT_LIMITS.NAME_MAX}
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={donorInfo.email}
                          onChange={(e) => setDonorInfo({...donorInfo, email: e.target.value})}
                          maxLength={INPUT_LIMITS.EMAIL_MAX}
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone Number (Optional)</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={donorInfo.phone}
                        onChange={(e) => setDonorInfo({...donorInfo, phone: e.target.value})}
                        maxLength={INPUT_LIMITS.PHONE_MAX}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Share why you're donating or any special instructions..."
                        value={donorInfo.message}
                        onChange={(e) => setDonorInfo({...donorInfo, message: e.target.value})}
                        maxLength={INPUT_LIMITS.MESSAGE_MAX}
                        rows={3}
                      />
                      <div className="text-sm text-muted-foreground text-right">
                        {donorInfo.message.length}/{INPUT_LIMITS.MESSAGE_MAX}
                      </div>
                    </div>
                  </div>

                  {/* Donation Summary */}
                  {finalAmount > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Donation Amount:</span>
                        <span className="text-2xl font-bold text-primary">
                          £{finalAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm font-medium">
                          {donationType === 'recurring' ? 'Monthly Recurring' : 'One-time'}
                        </span>
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={!finalAmount || finalAmount <= 0 || isLoading}
                  >
                    {isLoading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Heart className="h-5 w-5 mr-2" />
                        Complete Donation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-white py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Heart className="h-8 w-8 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Thank You for Your Generosity</h3>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Your support enables us to continue serving our community and making a positive impact. 
              Every donation, no matter the size, makes a difference.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Donate;