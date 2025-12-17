import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface RecommendationFilters {
  dateFrom?: Date;
  dateTo?: Date;
  location?: string;
  categories?: string[];
}

export const useEventRecommendations = (
  limit = 6,
  filters?: RecommendationFilters
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["event-recommendations", user?.id, filters],
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
      const userCategories = new Set<string>();
      
      savedEvents?.forEach((item) => {
        const event = item.events as { category: string | null } | null;
        if (event?.category) userCategories.add(event.category);
      });
      
      registeredEvents?.forEach((item) => {
        const event = item.events as { category: string | null } | null;
        if (event?.category) userCategories.add(event.category);
      });

      // Get event IDs user has already interacted with
      const interactedEventIds = new Set<string>();
      savedEvents?.forEach((item) => interactedEventIds.add(item.event_id));
      registeredEvents?.forEach((item) => interactedEventIds.add(item.event_id));

      // Determine which categories to filter by
      const categoriesToFilter = filters?.categories?.length 
        ? filters.categories 
        : userCategories.size > 0 
          ? Array.from(userCategories)
          : null;

      // Build the query
      let query = supabase
        .from("events")
        .select("*")
        .gte("date", filters?.dateFrom 
          ? filters.dateFrom.toISOString().split("T")[0] 
          : new Date().toISOString().split("T")[0]);

      // Apply date range filter
      if (filters?.dateTo) {
        query = query.lte("date", filters.dateTo.toISOString().split("T")[0]);
      }

      // Apply category filter
      if (categoriesToFilter && categoriesToFilter.length > 0) {
        query = query.in("category", categoriesToFilter);
      }

      // Apply location filter (partial match)
      if (filters?.location && filters.location.trim()) {
        query = query.ilike("location", `%${filters.location.trim()}%`);
      }

      query = query.order("date", { ascending: true }).limit(limit * 2);

      const { data: recommendedEvents } = await query;

      // Filter out events user has already interacted with
      const filteredEvents = recommendedEvents?.filter(
        (event) => !interactedEventIds.has(event.id)
      ) || [];

      // If not enough recommendations and no specific filters, supplement with other events
      if (filteredEvents.length < limit && !filters?.categories?.length && !filters?.location) {
        // Collect all IDs to exclude (interacted + already recommended)
        const excludeIds = new Set([
          ...Array.from(interactedEventIds),
          ...filteredEvents.map((e) => e.id)
        ]);

        let supplementQuery = supabase
          .from("events")
          .select("*")
          .gte("date", filters?.dateFrom 
            ? filters.dateFrom.toISOString().split("T")[0] 
            : new Date().toISOString().split("T")[0]);

        if (filters?.dateTo) {
          supplementQuery = supplementQuery.lte("date", filters.dateTo.toISOString().split("T")[0]);
        }

        if (excludeIds.size > 0) {
          supplementQuery = supplementQuery.not("id", "in", `(${Array.from(excludeIds).join(",")})`);
        }

        supplementQuery = supplementQuery
          .order("date", { ascending: true })
          .limit(limit - filteredEvents.length);

        const { data: additionalEvents } = await supplementQuery;

        return [...filteredEvents, ...(additionalEvents || [])].slice(0, limit);
      }

      return filteredEvents.slice(0, limit);
    },
    enabled: !!user,
  });
};

// Hook to get available categories for filter dropdown
export const useEventCategories = () => {
  return useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const { data } = await supabase
        .from("events")
        .select("category")
        .not("category", "is", null)
        .gte("date", new Date().toISOString().split("T")[0]);

      const categories = new Set<string>();
      data?.forEach((event) => {
        if (event.category) categories.add(event.category);
      });

      return Array.from(categories).sort();
    },
  });
};
