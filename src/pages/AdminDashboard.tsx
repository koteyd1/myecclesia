import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AdminEvents } from "@/components/admin/AdminEvents";
import { AdminBlogPosts } from "@/components/admin/AdminBlogPosts";
import { AdminUsers } from "@/components/admin/AdminUsers";
import AdminMinisters from "@/components/admin/AdminMinisters";
import AdminOrganizations from "@/components/admin/AdminOrganizations";

import { AdminEventReview } from "@/components/admin/AdminEventReview";
import { EventAnalytics } from "@/components/EventAnalytics";
import { SiteAnalytics } from "@/components/admin/SiteAnalytics";
import { AdminTickets } from "@/components/admin/AdminTickets";

const AdminDashboard = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminVerified, setAdminVerified] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate("/auth");
      return;
    }
    
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "You don't have admin privileges.",
      });
      navigate("/");
      return;
    }
    
    setAdminVerified(true);
  }, [user, isAdmin, authLoading, navigate, toast]);

  if (authLoading || !adminVerified) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground text-center">
            Manage events, blog posts, and users
          </p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="tickets">Tickets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
            <TabsTrigger value="blog">Blog Posts</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <AdminEvents user={user} />
          </TabsContent>

          <TabsContent value="tickets">
            <AdminTickets />
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <SiteAnalytics />
              <div className="border-t pt-6">
                <EventAnalytics />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="review">
            <AdminEventReview user={user} />
          </TabsContent>

          <TabsContent value="blog">
            <AdminBlogPosts user={user} />
          </TabsContent>

          <TabsContent value="organizations">
            <AdminOrganizations />
          </TabsContent>

          <TabsContent value="users">
            <AdminUsers user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;