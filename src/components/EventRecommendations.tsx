import { useEventRecommendations } from "@/hooks/useEventRecommendations";
import EventCard from "./EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export const EventRecommendations = () => {
  const { data: recommendations, isLoading } = useEventRecommendations(6);

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-8">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">Recommended for You</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-8">
          <Sparkles className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold">Recommended for You</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Based on your saved events and registrations
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((event) => (
            <EventCard 
              key={event.id} 
              {...event}
              image={event.image || ""}
              price={Number(event.price) || 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
