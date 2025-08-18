import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import Footer from "@/components/Footer";
import { ImageUpload } from "@/components/ImageUpload";

const ministerSchema = z.object({
  full_name: z.string().min(2, "Full name must be at least 2 characters"),
  location: z.string().min(2, "Location is required"),
  denomination: z.string().optional(),
  ministry_focus: z.string().min(2, "Ministry focus is required"),
  mission_statement: z.string().optional(),
});

type MinisterFormData = z.infer<typeof ministerSchema>;

interface SocialLink {
  platform: string;
  url: string;
}

interface BookingLink {
  service: string;
  url: string;
}

export default function MinisterForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [bookingLinks, setBookingLinks] = useState<BookingLink[]>([]);
  const [newBookingService, setNewBookingService] = useState("");
  const [newBookingUrl, setNewBookingUrl] = useState("");

  const form = useForm<MinisterFormData>({
    resolver: zodResolver(ministerSchema),
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (id) {
      fetchMinisterData();
    }
  }, [user, id, navigate]);

  const fetchMinisterData = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("ministers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      form.reset({
        full_name: data.full_name,
        location: data.location,
        denomination: data.denomination || "",
        ministry_focus: data.ministry_focus,
        mission_statement: data.mission_statement || "",
      });

      setProfileImageUrl(data.profile_image_url || "");
      setBannerUrl(data.banner_url || "");
      setServicesOffered(data.services_offered || []);
      
      // Convert JSONB to arrays
      const socialMediaLinks = data.social_media_links || {};
      setSocialLinks(Object.entries(socialMediaLinks).map(([platform, url]) => ({ platform, url })));
      
      const bookingLinksData = data.booking_links || {};
      setBookingLinks(Object.entries(bookingLinksData).map(([service, url]) => ({ service, url })));

    } catch (error) {
      console.error("Error fetching minister data:", error);
      toast({
        title: "Error",
        description: "Failed to load minister profile",
        variant: "destructive",
      });
    }
  };

  const addService = () => {
    if (newService.trim()) {
      setServicesOffered([...servicesOffered, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setServicesOffered(servicesOffered.filter((_, i) => i !== index));
  };

  const addSocialLink = () => {
    if (newSocialPlatform.trim() && newSocialUrl.trim()) {
      setSocialLinks([...socialLinks, { platform: newSocialPlatform.trim(), url: newSocialUrl.trim() }]);
      setNewSocialPlatform("");
      setNewSocialUrl("");
    }
  };

  const removeSocialLink = (index: number) => {
    setSocialLinks(socialLinks.filter((_, i) => i !== index));
  };

  const addBookingLink = () => {
    if (newBookingService.trim() && newBookingUrl.trim()) {
      setBookingLinks([...bookingLinks, { service: newBookingService.trim(), url: newBookingUrl.trim() }]);
      setNewBookingService("");
      setNewBookingUrl("");
    }
  };

  const removeBookingLink = (index: number) => {
    setBookingLinks(bookingLinks.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: MinisterFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Convert arrays to JSONB objects
      const socialMediaLinks = Object.fromEntries(
        socialLinks.map(link => [link.platform, link.url])
      );
      const bookingLinksData = Object.fromEntries(
        bookingLinks.map(link => [link.service, link.url])
      );

      const ministerData = {
        full_name: data.full_name,
        location: data.location,
        denomination: data.denomination || null,
        ministry_focus: data.ministry_focus,
        mission_statement: data.mission_statement || null,
        user_id: user.id,
        services_offered: servicesOffered,
        profile_image_url: profileImageUrl || null,
        banner_url: bannerUrl || null,
        social_media_links: socialMediaLinks,
        booking_links: bookingLinksData,
        slug: '', // Temporary slug, will be auto-generated by trigger
      };

      if (id) {
        // Update existing minister
        const { error } = await supabase
          .from("ministers")
          .update(ministerData)
          .eq("id", id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Minister profile updated successfully",
        });
      } else {
        // Create new minister
        const { data: newMinister, error } = await supabase
          .from("ministers")
          .insert(ministerData)
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Success",
          description: "Minister profile created successfully. It will be reviewed before going live.",
        });

        navigate(`/minister/${newMinister.slug}`);
      }
    } catch (error) {
      console.error("Error saving minister:", error);
      toast({
        title: "Error",
        description: "Failed to save minister profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please sign in to access this page.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>{id ? "Edit Minister Profile" : "Create Minister Profile"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      {...form.register("full_name")}
                      
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location (City, Country) *</Label>
                    <Input
                      id="location"
                      placeholder="e.g. London, United Kingdom"
                      {...form.register("location")}
                      
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="denomination">Denomination or Affiliation</Label>
                    <Input
                      id="denomination"
                      placeholder="e.g. Anglican, Pentecostal, Baptist"
                      {...form.register("denomination")}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ministry_focus">Ministry Focus *</Label>
                    <Input
                      id="ministry_focus"
                      placeholder="e.g. Preaching, Worship, Youth Ministry"
                      {...form.register("ministry_focus")}
                      
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="mission_statement">Mission Statement</Label>
                  <Textarea
                    id="mission_statement"
                    placeholder="Describe your personal calling and ministry vision"
                    rows={4}
                    {...form.register("mission_statement")}
                  />
                </div>
              </div>

              <Separator />

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Images</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Profile Image</Label>
                    <ImageUpload 
                      currentImageUrl={profileImageUrl}
                      onImageUrlChange={setProfileImageUrl} 
                    />
                  </div>
                  
                  <div>
                    <Label>Banner Image</Label>
                    <ImageUpload 
                      currentImageUrl={bannerUrl}
                      onImageUrlChange={setBannerUrl} 
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Services Offered */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Services Offered</h3>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Guest preaching, Mentoring, Online devotionals"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addService())}
                  />
                  <Button type="button" onClick={addService}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {servicesOffered.map((service, index) => (
                    <Badge key={index} variant="secondary" className="pr-2">
                      {service}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="ml-2 h-auto p-0"
                        onClick={() => removeService(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Social Media Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Platform (e.g. Facebook, Instagram)"
                    value={newSocialPlatform}
                    onChange={(e) => setNewSocialPlatform(e.target.value)}
                  />
                  <Input
                    placeholder="URL"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                  />
                  <Button type="button" onClick={addSocialLink}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="font-medium">{link.platform}:</span>
                      <span className="flex-1 truncate">{link.url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSocialLink(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Booking Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Booking Links</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Service (e.g. Speaking Engagements)"
                    value={newBookingService}
                    onChange={(e) => setNewBookingService(e.target.value)}
                  />
                  <Input
                    placeholder="Booking URL"
                    value={newBookingUrl}
                    onChange={(e) => setNewBookingUrl(e.target.value)}
                  />
                  <Button type="button" onClick={addBookingLink}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {bookingLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="font-medium">{link.service}:</span>
                      <span className="flex-1 truncate">{link.url}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeBookingLink(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : id ? "Update Profile" : "Create Profile"}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}