import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useEventRecommendations = (limit = 6) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["event-recommendations", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get categories from saved events
      const { data: savedEvents } = await supabase
        .from("saved_events")
        .select("event_id, events(category)")
        .eq("user_id", user.id);

      // Get categories from registered events
      const { data: registeredEvents } = await supabase
        .from("event_registrations")
        .select("event_id, events(category)")
        .eq("user_id", user.id);

      // Extract unique categories from user interactions
      const categories = new Set<string>();
      
      savedEvents?.forEach((item) => {
        const event = item.events as { category: string | null } | null;
        if (event?.category) categories.add(event.category);
      });
      
      registeredEvents?.forEach((item) => {
        const event = item.events as { category: string | null } | null;
        if (event?.category) categories.add(event.category);
      });

      // Get event IDs user has already interacted with
      const interactedEventIds = new Set<string>();
      savedEvents?.forEach((item) => interactedEventIds.add(item.event_id));
      registeredEvents?.forEach((item) => interactedEventIds.add(item.event_id));

      // If no preferences found, return featured/upcoming events
      if (categories.size === 0) {
        const { data: upcomingEvents } = await supabase
          .from("events")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true })
          .limit(limit);

        return upcomingEvents || [];
      }

      // Query events matching user's preferred categories
      const { data: recommendedEvents } = await supabase
        .from("events")
        .select("*")
        .in("category", Array.from(categories))
        .gte("date", new Date().toISOString().split("T")[0])
        .order("date", { ascending: true })
        .limit(limit * 2); // Fetch more to filter out interacted ones

      // Filter out events user has already interacted with
      const filteredEvents = recommendedEvents?.filter(
        (event) => !interactedEventIds.has(event.id)
      ) || [];

      // If not enough recommendations, supplement with other upcoming events
      if (filteredEvents.length < limit) {
        const { data: additionalEvents } = await supabase
          .from("events")
          .select("*")
          .gte("date", new Date().toISOString().split("T")[0])
          .not("id", "in", `(${Array.from(interactedEventIds).join(",") || "00000000-0000-0000-0000-000000000000"})`)
          .order("date", { ascending: true })
          .limit(limit - filteredEvents.length);

        return [...filteredEvents, ...(additionalEvents || [])].slice(0, limit);
      }

      return filteredEvents.slice(0, limit);
    },
    enabled: !!user,
  });
};
