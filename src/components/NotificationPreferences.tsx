import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useEventCategories } from "@/hooks/useEventRecommendations";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, MapPin, Tag, X, Plus, Loader2 } from "lucide-react";

interface NotificationPreferences {
  id?: string;
  user_id: string;
  email: string;
  categories: string[];
  locations: string[];
  enabled: boolean;
}

export const NotificationPreferences = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: availableCategories = [] } = useEventCategories();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences(data);
        setEnabled(data.enabled);
        setSelectedCategories(data.categories || []);
        setLocations(data.locations || []);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const prefsData = {
        user_id: user.id,
        email: user.email!,
        categories: selectedCategories,
        locations,
        enabled,
      };

      if (preferences?.id) {
        // Update existing
        const { error } = await supabase
          .from("notification_preferences")
          .update(prefsData)
          .eq("id", preferences.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("notification_preferences")
          .insert(prefsData);

        if (error) throw error;
      }

      toast({
        title: "Preferences saved",
        description: enabled 
          ? "You'll receive notifications for new matching events" 
          : "Event notifications are now disabled",
      });

      fetchPreferences();
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const addLocation = () => {
    if (newLocation.trim() && !locations.includes(newLocation.trim())) {
      setLocations([...locations, newLocation.trim()]);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    setLocations(locations.filter((l) => l !== location));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <CardTitle>Event Notifications</CardTitle>
              <CardDescription>
                Get notified when new events match your interests
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="notifications-enabled" className="text-sm">
              {enabled ? "Enabled" : "Disabled"}
            </Label>
            <Switch
              id="notifications-enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {enabled && (
          <>
            {/* Category Preferences */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Event Categories
              </Label>
              <p className="text-sm text-muted-foreground">
                Select categories you're interested in. Leave empty to receive all event notifications.
              </p>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
              {selectedCategories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedCategories.length} categor{selectedCategories.length === 1 ? "y" : "ies"} selected
                </p>
              )}
            </div>

            {/* Location Preferences */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Preferred Locations
              </Label>
              <p className="text-sm text-muted-foreground">
                Add cities or areas you're interested in. Leave empty to receive events from all locations.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a city or area..."
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addLocation()}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={addLocation}
                  disabled={!newLocation.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {locations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <Badge key={location} variant="secondary" className="flex items-center gap-1">
                      {location}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeLocation(location)} 
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Email Info */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm">
                <strong>Notifications will be sent to:</strong> {user?.email}
              </p>
            </div>
          </>
        )}

        <Button 
          onClick={savePreferences} 
          disabled={saving}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
