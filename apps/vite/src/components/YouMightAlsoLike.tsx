import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import EventCard from "@/components/EventCard";
import { Sparkles } from "lucide-react";

interface YouMightAlsoLikeProps {
  currentEventId: string;
  category?: string | null;
  location?: string | null;
}

export const YouMightAlsoLike = ({ currentEventId, category, location }: YouMightAlsoLikeProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSimilar = async () => {
      try {
        let query = supabase
          .from("events")
          .select("id, slug, title, date, time, location, image, price, category, denominations")
          .eq("is_verified", true)
          .neq("id", currentEventId)
          .gte("date", new Date().toISOString().split("T")[0])
          .order("date", { ascending: true })
          .limit(6);

        // Prefer same category
        if (category) {
          query = query.eq("category", category);
        }

        const { data, error } = await query;
        if (error) throw error;

        let results = data || [];

        // If not enough from same category, backfill
        if (results.length < 3) {
          const existingIds = [currentEventId, ...results.map(e => e.id)];
          const { data: more } = await supabase
            .from("events")
            .select("id, slug, title, date, time, location, image, price, category, denominations")
            .eq("is_verified", true)
            .not("id", "in", `(${existingIds.join(",")})`)
            .gte("date", new Date().toISOString().split("T")[0])
            .order("date", { ascending: true })
            .limit(6 - results.length);
          
          results = [...results, ...(more || [])];
        }

        setEvents(results.slice(0, 3));
      } catch (error) {
        console.error("Error fetching similar events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSimilar();
  }, [currentEventId, category]);

  if (loading || events.length === 0) return null;

  return (
    <div className="mt-10">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">You Might Also Like</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {events.map((event) => (
          <EventCard
            key={event.id}
            {...event}
            image={event.image || ""}
            price={Number(event.price) || 0}
          />
        ))}
      </div>
    </div>
  );
};
