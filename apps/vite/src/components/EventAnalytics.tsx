import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Eye, Users, Calendar, TrendingUp, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EventAnalytic {
  event_id: string;
  event_title: string;
  event_date: string;
  total_views: number;
  total_registrations: number;
  total_calendar_adds: number;
  recent_views: number;
  registration_rate: number;
}

interface AnalyticsSummary {
  total_events: number;
  total_views: number;
  total_registrations: number;
  avg_registration_rate: number;
  upcoming_events: number;
}

export function EventAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<EventAnalytic[]>([]);
  const [summaryData, setSummaryData] = useState<AnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Fetch event analytics
      const { data: eventAnalytics, error: eventError } = await supabase
        .rpc('get_event_organizer_analytics', { organizer_id: user.id });

      if (eventError) throw eventError;

      // Fetch summary data
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_organizer_analytics_summary', { organizer_id: user.id });

      if (summaryError) throw summaryError;

      setAnalyticsData(eventAnalytics || []);
      setSummaryData(summary?.[0] || null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Please sign in to view your event analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string 
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Event Analytics</h2>
          <p className="text-muted-foreground">
            Track the performance of your events
          </p>
        </div>
        <Button onClick={fetchAnalytics} variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {summaryData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total Events"
            value={summaryData.total_events}
            icon={BarChart3}
            description="Events you've created"
          />
          <StatCard
            title="Total Views"
            value={summaryData.total_views}
            icon={Eye}
            description="Total event page views"
          />
          <StatCard
            title="Registrations"
            value={summaryData.total_registrations}
            icon={Users}
            description="Total event registrations"
          />
          <StatCard
            title="Avg. Conversion"
            value={`${summaryData.avg_registration_rate}%`}
            icon={TrendingUp}
            description="Views to registrations"
          />
          <StatCard
            title="Upcoming Events"
            value={summaryData.upcoming_events}
            icon={CalendarIcon}
            description="Future events"
          />
        </div>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Event Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Individual Event Performance</CardTitle>
              <CardDescription>
                Detailed analytics for each of your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsData.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No events found. Create your first event to see analytics!
                </p>
              ) : (
                <div className="space-y-4">
                  {analyticsData.map((event) => (
                    <div
                      key={event.event_id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{event.event_title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.event_date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={new Date(event.event_date) > new Date() ? 'default' : 'secondary'}>
                          {new Date(event.event_date) > new Date() ? 'Upcoming' : 'Past'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            Views
                          </div>
                          <div className="text-xl font-bold">{event.total_views}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.recent_views} this week
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            Registered
                          </div>
                          <div className="text-xl font-bold">{event.total_registrations}</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Calendar Adds
                          </div>
                          <div className="text-xl font-bold">{event.total_calendar_adds}</div>
                        </div>

                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4" />
                            Conversion
                          </div>
                          <div className="text-xl font-bold">{event.registration_rate}%</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Insights</CardTitle>
                <CardDescription>
                  Key metrics about your events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryData && analyticsData.length > 0 ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average views per event:</span>
                      <span className="font-medium">
                        {Math.round(summaryData.total_views / summaryData.total_events)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Average registrations per event:</span>
                      <span className="font-medium">
                        {Math.round(summaryData.total_registrations / summaryData.total_events)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Best performing event:</span>
                      <span className="font-medium">
                        {analyticsData.reduce((best, current) => 
                          current.registration_rate > best.registration_rate ? current : best
                        ).event_title}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Create events to see performance insights
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Tips</CardTitle>
                <CardDescription>
                  Suggestions to improve your event performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong>Increase visibility:</strong> Share your events on social media and community groups
                </div>
                <div className="text-sm">
                  <strong>Optimize timing:</strong> Events on weekends typically get higher engagement
                </div>
                <div className="text-sm">
                  <strong>Improve descriptions:</strong> Clear, detailed descriptions increase conversion rates
                </div>
                <div className="text-sm">
                  <strong>Add images:</strong> Events with images get 2x more views
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}