import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Download, FileJson, Loader2 } from "lucide-react";

export const DataExportButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleExportData = async () => {
    if (!user) return;

    setIsExporting(true);

    try {
      // Collect all user data from various tables
      const userData: Record<string, any> = {
        exportDate: new Date().toISOString(),
        userId: user.id,
        email: user.email,
      };

      // Profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile) {
        // Remove sensitive internal fields
        const { id, user_id, ...profileData } = profile;
        userData.profile = profileData;
      }

      // Event registrations
      const { data: registrations } = await supabase
        .from("event_registrations")
        .select(`
          registered_at,
          status,
          events (
            title,
            date,
            time,
            location
          )
        `)
        .eq("user_id", user.id);
      if (registrations?.length) {
        userData.eventRegistrations = registrations;
      }

      // Saved events
      const { data: savedEvents } = await supabase
        .from("saved_events")
        .select(`
          created_at,
          events (
            title,
            date,
            location
          )
        `)
        .eq("user_id", user.id);
      if (savedEvents?.length) {
        userData.savedEvents = savedEvents;
      }

      // Tickets
      const { data: tickets } = await supabase
        .from("tickets")
        .select(`
          quantity,
          status,
          created_at,
          events (
            title,
            date,
            location
          ),
          ticket_types (
            name,
            price
          )
        `)
        .eq("user_id", user.id);
      if (tickets?.length) {
        userData.tickets = tickets;
      }

      // User calendar
      const { data: calendar } = await supabase
        .from("user_calendar")
        .select(`
          added_at,
          events (
            title,
            date,
            time,
            location
          )
        `)
        .eq("user_id", user.id);
      if (calendar?.length) {
        userData.calendar = calendar;
      }

      // Notification preferences
      const { data: notifPrefs } = await supabase
        .from("notification_preferences")
        .select("categories, locations, enabled, email")
        .eq("user_id", user.id)
        .maybeSingle();
      if (notifPrefs) {
        userData.notificationPreferences = notifPrefs;
      }

      // Minister profile (if any)
      const { data: minister } = await supabase
        .from("ministers")
        .select("full_name, location, ministry_focus, denomination, mission_statement, services_offered")
        .eq("user_id", user.id)
        .maybeSingle();
      if (minister) {
        userData.ministerProfile = minister;
      }

      // Organization profile (if any)
      const { data: organization } = await supabase
        .from("organizations")
        .select("name, address, postcode, country, denomination, mission_statement, services_offered")
        .eq("user_id", user.id)
        .maybeSingle();
      if (organization) {
        userData.organizationProfile = organization;
      }

      // Minister follows
      const { data: ministerFollows } = await supabase
        .from("minister_followers")
        .select(`
          created_at,
          ministers (
            full_name,
            location
          )
        `)
        .eq("user_id", user.id);
      if (ministerFollows?.length) {
        userData.followedMinisters = ministerFollows;
      }

      // Organization follows
      const { data: orgFollows } = await supabase
        .from("organization_followers")
        .select(`
          created_at,
          organizations (
            name,
            address
          )
        `)
        .eq("user_id", user.id);
      if (orgFollows?.length) {
        userData.followedOrganizations = orgFollows;
      }

      // Donations (user's own, masked for privacy)
      const { data: donations } = await supabase
        .rpc("get_user_donations");
      if (donations?.length) {
        userData.donations = donations;
      }

      // Create and download the JSON file
      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `myecclesia-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data Exported Successfully",
        description: "Your personal data has been downloaded as a JSON file.",
      });

      setIsOpen(false);
    } catch (error: any) {
      console.error("Error exporting data:", error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Download My Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5 text-primary" />
            Export Your Personal Data
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>
              As part of your GDPR rights, you can download a copy of all personal data 
              we hold about you. This includes:
            </p>
            <ul className="list-disc ml-6 space-y-1 text-sm">
              <li>Profile information</li>
              <li>Event registrations and saved events</li>
              <li>Tickets and purchase history</li>
              <li>Notification preferences</li>
              <li>Organization or minister profiles (if applicable)</li>
              <li>Followed ministers and organizations</li>
            </ul>
            <p className="text-sm">
              Your data will be downloaded as a JSON file that you can view in any text editor.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isExporting}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleExportData} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Preparing Export...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download Data
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DataExportButton;
