import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const LoadingEventCard = () => (
  <Card className="overflow-hidden rounded-xl border border-border/50">
    {/* Image skeleton with aspect ratio */}
    <div className="relative aspect-[4/3]">
      <Skeleton className="w-full h-full" />
      <div className="absolute top-3 left-3">
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="absolute top-3 right-3">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <div className="absolute bottom-3 left-3">
        <Skeleton className="h-6 w-14 rounded-full" />
      </div>
    </div>
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-full" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex items-center gap-2 pt-3 border-t border-border/50">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  </Card>
);

export const LoadingBlogCard = () => (
  <Card className="group cursor-pointer hover:shadow-lg transition-shadow">
    <CardHeader className="pb-3">
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-32 w-full mb-4 rounded-md" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="flex items-center gap-4 mt-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);