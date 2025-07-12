import { useState } from "react";
import { Heart, DollarSign, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";

const donationOptions = [
  { amount: 25, label: "$25", description: "Helps provide meals for community events" },
  { amount: 50, label: "$50", description: "Supports youth program activities" },
  { amount: 100, label: "$100", description: "Funds educational workshops and materials" },
  { amount: 250, label: "$250", description: "Sponsors a family retreat weekend" },
];

const Donate = () => {
  const { toast } = useToast();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
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

  const handleSubmit = (e: React.FormEvent) => {
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

    if (!donorInfo.name || !donorInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please provide your name and email address.",
        variant: "destructive",
      });
      return;
    }

    // For now, just show success message since payment isn't integrated yet
    toast({
      title: "Thank You!",
      description: `Your donation of $${donationAmount} has been received. Payment processing will be available soon.`,
    });
    
    console.log("Donation submission:", {
      amount: donationAmount,
      donor: donorInfo
    });
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Community Events</h3>
              <p className="text-muted-foreground">
                Supporting 50+ community events annually, bringing families together
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Outreach Programs</h3>
              <p className="text-muted-foreground">
                Feeding 200+ families monthly through our food pantry and meal programs
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-secondary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Youth Development</h3>
              <p className="text-muted-foreground">
                Providing educational and spiritual growth opportunities for 100+ youth
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
                  Choose an amount or enter a custom donation
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
                          className="h-24 p-3 flex flex-col items-center justify-center text-center gap-1"
                          onClick={() => handleAmountSelect(option.amount)}
                        >
                          <span className="text-lg font-bold">{option.label}</span>
                          <span className="text-xs leading-tight opacity-80 max-w-full break-words">
                            {option.description}
                          </span>
                        </Button>
                      ))}
                    </div>
                    
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
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
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Message (Optional)</Label>
                      <Textarea
                        id="message"
                        placeholder="Share why you're donating or any special instructions..."
                        value={donorInfo.message}
                        onChange={(e) => setDonorInfo({...donorInfo, message: e.target.value})}
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Donation Summary */}
                  {finalAmount > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">Donation Amount:</span>
                        <span className="text-2xl font-bold text-primary">
                          ${finalAmount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Payment processing will be available soon. For now, this is a preview of your donation.
                      </p>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full"
                    disabled={!finalAmount || finalAmount <= 0}
                  >
                    <Heart className="h-5 w-5 mr-2" />
                    Complete Donation
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