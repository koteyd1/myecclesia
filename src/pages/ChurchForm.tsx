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
import { ImageUpload } from "@/components/ImageUpload";

const churchSchema = z.object({
  name: z.string().min(2, "Church name must be at least 2 characters"),
  address: z.string().min(2, "Address is required"),
  postcode: z.string().min(2, "Postcode is required"),
  country: z.string().min(2, "Country is required"),
  denomination: z.string().optional(),
  mission_statement: z.string().optional(),
  service_times: z.string().optional(),
  pastor_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  website: z.string().optional(),
  safeguarding_contact: z.string().optional(),
});

type ChurchFormData = z.infer<typeof churchSchema>;

interface SocialLink {
  platform: string;
  url: string;
}

export default function ChurchForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [bannerUrl, setBannerUrl] = useState<string>("");
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newSocialPlatform, setNewSocialPlatform] = useState("");
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [isAdminEditing, setIsAdminEditing] = useState(false);
  const [churchUserId, setChurchUserId] = useState<string | null>(null);

  const form = useForm<ChurchFormData>({
    resolver: zodResolver(churchSchema),
    defaultValues: {
      country: "United Kingdom",
    },
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (id) {
      fetchChurchData();
    }
  }, [user, id, navigate]);

  const fetchChurchData = async () => {
    if (!id || !user) return;
    try {
      const { data, error } = await supabase
        .from("churches")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (data.user_id !== user.id && !isAdmin) {
        toast({ title: "Access Denied", description: "You don't have permission to edit this profile.", variant: "destructive" });
        navigate('/my-profiles');
        return;
      }

      setChurchUserId(data.user_id);
      setIsAdminEditing(isAdmin && data.user_id !== user.id);

      form.reset({
        name: data.name,
        address: data.address,
        postcode: data.postcode,
        country: data.country,
        denomination: data.denomination || "",
        mission_statement: data.mission_statement || "",
        service_times: data.service_times || "",
        pastor_name: data.pastor_name || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        safeguarding_contact: data.safeguarding_contact || "",
      });

      setLogoUrl(data.logo_url || "");
      setBannerUrl(data.banner_url || "");
      setServicesOffered(data.services_offered || []);

      const socialMediaLinks = data.social_media_links as Record<string, string> || {};
      setSocialLinks(Object.entries(socialMediaLinks).map(([platform, url]) => ({ platform, url })));
    } catch (error) {
      console.error("Error fetching church data:", error);
      toast({ title: "Error", description: "Failed to load church profile", variant: "destructive" });
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

  const onSubmit = async (data: ChurchFormData) => {
    if (!user?.id) {
      toast({ title: "Authentication required", description: "Please sign in to create a church profile", variant: "destructive" });
      navigate('/auth');
      return;
    }

    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.id) {
      toast({ title: "Session expired", description: "Please sign in again to continue", variant: "destructive" });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const socialMediaLinks = Object.fromEntries(socialLinks.map(link => [link.platform, link.url]));
      const tempSlug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      const churchData = {
        name: data.name,
        address: data.address,
        postcode: data.postcode,
        country: data.country || "United Kingdom",
        denomination: data.denomination || null,
        mission_statement: data.mission_statement || null,
        service_times: data.service_times || null,
        pastor_name: data.pastor_name || null,
        phone: data.phone || null,
        email: data.email || null,
        website: data.website || null,
        safeguarding_contact: data.safeguarding_contact || null,
        user_id: id && isAdminEditing ? churchUserId! : user.id,
        services_offered: servicesOffered,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
        social_media_links: socialMediaLinks,
        slug: tempSlug,
      };

      if (id) {
        const { error } = await supabase.from("churches").update(churchData).eq("id", id);
        if (error) throw error;
        toast({ title: "Success", description: "Church profile updated successfully" });
        navigate(isAdminEditing ? '/admin' : '/my-profiles');
      } else {
        const { data: newChurch, error } = await supabase.from("churches").insert(churchData).select().single();
        if (error) throw error;
        toast({ title: "Success", description: "Church profile created successfully. It will be reviewed before going live." });
        navigate(`/church/${newChurch.slug}`);
      }
    } catch (error) {
      console.error("Error saving church:", error);
      toast({ title: "Error", description: "Failed to save church profile", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Please sign in to access this page.</p></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>
              {id ? (isAdminEditing ? "Edit Church Profile (Admin)" : "Edit Church Profile") : "Create Church Profile"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Church Name *</Label>
                    <Input id="name" {...form.register("name")} />
                    {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                  </div>
                  <div>
                    <Label htmlFor="denomination">Denomination</Label>
                    <Input id="denomination" placeholder="e.g. Anglican, Pentecostal, Baptist" {...form.register("denomination")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="address">Address *</Label>
                    <Input id="address" {...form.register("address")} />
                  </div>
                  <div>
                    <Label htmlFor="postcode">Postcode *</Label>
                    <Input id="postcode" {...form.register("postcode")} />
                  </div>
                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" {...form.register("country")} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="pastor_name">Pastor / Lead Minister</Label>
                    <Input id="pastor_name" {...form.register("pastor_name")} />
                  </div>
                  <div>
                    <Label htmlFor="service_times">Service Times</Label>
                    <Input id="service_times" placeholder="e.g. Sunday 10:30am, Wednesday 7pm" {...form.register("service_times")} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="mission_statement">Mission Statement</Label>
                  <Textarea id="mission_statement" placeholder="Describe your church's vision and mission" rows={4} {...form.register("mission_statement")} />
                </div>
              </div>

              <Separator />

              {/* Contact Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" {...form.register("phone")} />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" {...form.register("email")} />
                  </div>
                  <div>
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://" {...form.register("website")} />
                  </div>
                </div>
                <div>
                  <Label htmlFor="safeguarding_contact">Safeguarding Contact</Label>
                  <Input id="safeguarding_contact" {...form.register("safeguarding_contact")} />
                </div>
              </div>

              <Separator />

              {/* Images */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Images</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Church Logo</Label>
                    <ImageUpload currentImageUrl={logoUrl} onImageUrlChange={setLogoUrl} />
                  </div>
                  <div>
                    <Label>Banner Image</Label>
                    <ImageUpload currentImageUrl={bannerUrl} onImageUrlChange={setBannerUrl} />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Services Offered */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ministries & Services</h3>
                <div className="flex gap-2">
                  <Input placeholder="e.g. Sunday School, Youth Group, Food Bank" value={newService} onChange={(e) => setNewService(e.target.value)} onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addService())} />
                  <Button type="button" onClick={addService}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {servicesOffered.map((service, index) => (
                    <Badge key={index} variant="secondary" className="pr-2">
                      {service}
                      <Button type="button" variant="ghost" size="sm" className="ml-2 h-auto p-0" onClick={() => removeService(index)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Social Media */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Social Media Links</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input placeholder="Platform (e.g. Facebook)" value={newSocialPlatform} onChange={(e) => setNewSocialPlatform(e.target.value)} />
                  <Input placeholder="URL" value={newSocialUrl} onChange={(e) => setNewSocialUrl(e.target.value)} />
                  <Button type="button" onClick={addSocialLink}><Plus className="w-4 h-4" /></Button>
                </div>
                <div className="space-y-2">
                  {socialLinks.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      <span className="font-medium">{link.platform}:</span>
                      <span className="flex-1 truncate">{link.url}</span>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeSocialLink(index)}>
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
                <Button type="button" variant="outline" onClick={() => isAdminEditing ? navigate('/admin') : navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
