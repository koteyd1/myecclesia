import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Users, Heart, AlertTriangle, Clock, MapPin, Phone, FileText } from "lucide-react";

const EventGuidelines = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Event Guidelines & Safety Protocols
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please review these important guidelines to ensure a safe and meaningful experience for all attendees at our Christian events.
            </p>
          </div>

          {/* General Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                General Event Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <p><strong>Respectful Behavior:</strong> Maintain a respectful and Christ-like attitude towards all attendees, staff, and volunteers.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <p><strong>Dress Code:</strong> Please dress modestly and appropriately for the event type and venue.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <p><strong>Registration:</strong> Pre-registration is required for most events. Walk-ins may be accommodated based on availability.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <p><strong>Age Requirements:</strong> Some events may have age restrictions. Check event details before registering children.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">5</Badge>
                  <p><strong>Photography:</strong> Photos may be taken during events for promotional purposes. Please inform staff if you prefer not to be photographed.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Protocols */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Safety Protocols
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Health & Wellness
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>• Stay home if you're feeling unwell</li>
                    <li>• Inform staff of any medical conditions or allergies</li>
                    <li>• Take regular breaks during long events</li>
                    <li>• Stay hydrated and eat regularly</li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Child Safety
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                    <li>• Children must be supervised by a parent or guardian</li>
                    <li>• Check-in/check-out procedures for children's programs</li>
                    <li>• Background-checked volunteers only in childcare areas</li>
                    <li>• Emergency contact information required</li>
                  </ul>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  Emergency Procedures
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p><strong>Local Emergency:</strong> 999</p>
                  </div>
                  <div>
                    <p><strong>First Aid:</strong> Available at registration desk</p>
                    <p><strong>Evacuation:</strong> Follow posted exit signs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event-Specific Guidelines */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                Event-Specific Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Worship Services</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Arrive 10-15 minutes early for seating</li>
                    <li>• Silent or vibrate phone settings</li>
                    <li>• Participate respectfully in worship</li>
                    <li>• Children's ministry available during service</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Fellowship Events</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Bring a dish to share if potluck style</li>
                    <li>• Help with setup and cleanup</li>
                    <li>• Include newcomers in conversations</li>
                    <li>• Respect dietary restrictions and preferences</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Educational Programs</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Bring notebook and writing materials</li>
                    <li>• Active participation encouraged</li>
                    <li>• Respect diverse viewpoints in discussion</li>
                    <li>• Complete any assigned readings</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3">Retreat Events</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground ml-4">
                    <li>• Pack according to provided list</li>
                    <li>• Arrive on time for departure</li>
                    <li>• Respect shared accommodations</li>
                    <li>• Participate in group activities</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Arrival and Departure */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Arrival & Departure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Before You Arrive</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Check event details and any updates</li>
                    <li>• Plan your transportation and parking</li>
                    <li>• Bring registration confirmation if required</li>
                    <li>• Review any preparation materials</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">At the Event</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• Check in at registration table</li>
                    <li>• Pick up name tags and materials</li>
                    <li>• Note location of restrooms and emergency exits</li>
                    <li>• Introduce yourself to others</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Questions or Concerns?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">
                    If you have any questions or concerns about event guidelines, please speak with event staff or coordinators during the event.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  "Therefore encourage one another and build each other up, just as in fact you are doing." - 1 Thessalonians 5:11
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EventGuidelines;