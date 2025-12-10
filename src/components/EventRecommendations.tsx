import { useState } from "react";
import { useEventRecommendations, useEventCategories, RecommendationFilters } from "@/hooks/useEventRecommendations";
import EventCard from "./EventCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Sparkles, Filter, CalendarIcon, MapPin, X, ChevronDown } from "lucide-react";

export const EventRecommendations = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<RecommendationFilters>({});
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [locationInput, setLocationInput] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();

  const { data: categories = [] } = useEventCategories();
  const { data: recommendations, isLoading } = useEventRecommendations(9, filters);

  const applyFilters = () => {
    setFilters({
      dateFrom,
      dateTo,
      location: locationInput,
      categories: selectedCategories.length > 0 ? selectedCategories : undefined,
    });
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setLocationInput("");
    setSelectedCategories([]);
    setFilters({});
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const hasActiveFilters = dateFrom || dateTo || locationInput || selectedCategories.length > 0;

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

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-bold">Recommended for You</h2>
            </div>
            <p className="text-muted-foreground">
              Based on your saved events and registrations
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {(dateFrom ? 1 : 0) + (dateTo ? 1 : 0) + (locationInput ? 1 : 0) + selectedCategories.length}
              </Badge>
            )}
            <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-card border rounded-lg p-4 mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Date Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateFrom && "text-muted-foreground"
                        )}
                      >
                        {dateFrom ? format(dateFrom, "MMM d") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateFrom}
                        onSelect={setDateFrom}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !dateTo && "text-muted-foreground"
                        )}
                      >
                        {dateTo ? format(dateTo, "MMM d") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={dateTo}
                        onSelect={setDateTo}
                        disabled={(date) => date < (dateFrom || new Date())}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </label>
                <Input
                  placeholder="Search by city or area..."
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  className="h-9"
                />
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {categories.map((category) => (
                    <Badge
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              )}
              <Button size="sm" onClick={applyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters && !showFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {dateFrom && (
              <Badge variant="secondary" className="flex items-center gap-1">
                From: {format(dateFrom, "MMM d")}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setDateFrom(undefined); applyFilters(); }} />
              </Badge>
            )}
            {dateTo && (
              <Badge variant="secondary" className="flex items-center gap-1">
                To: {format(dateTo, "MMM d")}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setDateTo(undefined); applyFilters(); }} />
              </Badge>
            )}
            {locationInput && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {locationInput}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { setLocationInput(""); applyFilters(); }} />
              </Badge>
            )}
            {selectedCategories.map((cat) => (
              <Badge key={cat} variant="secondary" className="flex items-center gap-1">
                {cat}
                <X className="h-3 w-3 cursor-pointer" onClick={() => { toggleCategory(cat); applyFilters(); }} />
              </Badge>
            ))}
          </div>
        )}

        {/* Results */}
        {!recommendations || recommendations.length === 0 ? (
          <div className="text-center py-12 bg-card border rounded-lg">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No recommendations found</h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters
                ? "Try adjusting your filters to see more events"
                : "Save or register for events to get personalized recommendations"}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
};
