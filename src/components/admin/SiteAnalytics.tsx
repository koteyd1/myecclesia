import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Users, Calendar, TrendingUp, BarChart3, Globe, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SiteAnalyticsData {
  total_page_views: number;
  unique_visitors: number;
  total_sessions: number;
  total_blog_views: number;
  total_event_views: number;
  total_registrations: number;
  most_viewed_pages: Array<{
    page_path: string;
    page_title: string;
    total_views: number;
  }>;
  most_viewed_blogs: Array<{
    blog_id: string;
    title: string;
    total_views: number;
  }>;
  most_viewed_events: Array<{
    event_id: string;
    title: string;
    total_views: number;
  }>;
  daily_views: Record<string, {
    page_views: number;
    blog_views: number;
    event_views: number;
  }>;
}

interface ChartDataPoint {
  date: string;
  page_views: number;
  blog_views: number;
  event_views: number;
  unique_visitors: number;
  total_views: number;
}

export function SiteAnalytics() {
  const { toast } = useToast();
  const [analyticsData, setAnalyticsData] = useState<SiteAnalyticsData | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);

      // Fetch site analytics summary
      const { data, error } = await supabase
        .rpc('get_site_analytics_summary', { days_back: parseInt(selectedPeriod) });

      if (error) throw error;

      // Fetch chart data
      const { data: chartData, error: chartError } = await supabase
        .rpc('get_daily_analytics_chart', { days_back: parseInt(selectedPeriod) });

      if (chartError) throw chartError;

      const analyticsData = data?.[0];
      if (analyticsData) {
        setAnalyticsData({
          total_page_views: analyticsData.total_page_views || 0,
          unique_visitors: analyticsData.unique_visitors || 0,
          total_sessions: analyticsData.total_sessions || 0,
          total_blog_views: analyticsData.total_blog_views || 0,
          total_event_views: analyticsData.total_event_views || 0,
          total_registrations: analyticsData.total_registrations || 0,
          most_viewed_pages: (analyticsData.most_viewed_pages as any[]) || [],
          most_viewed_blogs: (analyticsData.most_viewed_blogs as any[]) || [],
          most_viewed_events: (analyticsData.most_viewed_events as any[]) || [],
          daily_views: (analyticsData.daily_views as Record<string, any>) || {},
        });
      }

      // Process chart data
      if (chartData) {
        const formattedChartData = chartData.map((point: any) => ({
          date: new Date(point.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          page_views: point.page_views || 0,
          blog_views: point.blog_views || 0,
          event_views: point.event_views || 0,
          unique_visitors: point.unique_visitors || 0,
          total_views: point.total_views || 0,
        }));
        setChartData(formattedChartData);
      }
    } catch (error) {
      console.error('Error fetching site analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load site analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Loading site analytics...</p>
        </CardContent>
      </Card>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    description,
    trend
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    description?: string;
    trend?: string;
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
        {trend && (
          <Badge variant="outline" className="mt-2 text-xs">
            {trend}
          </Badge>
        )}
      </CardContent>
    </Card>
  );

  const dailyViewsArray = Object.entries(analyticsData?.daily_views || {})
    .map(([date, data]) => ({
      date,
      ...data
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Site Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive website engagement analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline">
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {analyticsData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <StatCard
            title="Total Page Views"
            value={analyticsData.total_page_views.toLocaleString()}
            icon={Globe}
            description="All page visits"
          />
          <StatCard
            title="Unique Visitors"
            value={analyticsData.unique_visitors.toLocaleString()}
            icon={Users}
            description="Unique people"
          />
          <StatCard
            title="Total Sessions"
            value={analyticsData.total_sessions.toLocaleString()}
            icon={BarChart3}
            description="Browsing sessions"
          />
          <StatCard
            title="Blog Views"
            value={analyticsData.total_blog_views.toLocaleString()}
            icon={FileText}
            description="Blog post views"
          />
          <StatCard
            title="Event Views"
            value={analyticsData.total_event_views.toLocaleString()}
            icon={Eye}
            description="Event page views"
          />
          <StatCard
            title="Event Registrations"
            value={analyticsData.total_registrations.toLocaleString()}
            icon={Calendar}
            description="Total registrations"
          />
        </div>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chart">Performance Chart</TabsTrigger>
          <TabsTrigger value="content">Top Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Engagement Summary</CardTitle>
                <CardDescription>
                  Key metrics about your website performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Pages per session:</span>
                      <span className="font-medium">
                        {analyticsData.total_sessions > 0 
                          ? (analyticsData.total_page_views / analyticsData.total_sessions).toFixed(1)
                          : '0'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Event conversion rate:</span>
                      <span className="font-medium">
                        {analyticsData.total_event_views > 0
                          ? ((analyticsData.total_registrations / analyticsData.total_event_views) * 100).toFixed(1)
                          : '0'
                        }%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Content engagement:</span>
                      <span className="font-medium">
                        {((analyticsData.total_blog_views + analyticsData.total_event_views) / analyticsData.total_page_views * 100).toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Insights</CardTitle>
                <CardDescription>
                  Analytics insights and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <strong>High-performing content:</strong> Events and blogs are driving significant engagement
                </div>
                <div className="text-sm">
                  <strong>Visitor retention:</strong> Focus on creating valuable, shareable content
                </div>
                <div className="text-sm">
                  <strong>SEO opportunity:</strong> Optimize your most-viewed pages for better search rankings
                </div>
                <div className="text-sm">
                  <strong>User experience:</strong> Analyze popular pages to improve navigation and content discovery
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chart" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Over Time</CardTitle>
              <CardDescription>
                Daily trends showing website engagement metrics (excluding admin activity)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className="text-muted-foreground">No data available for the selected period</p>
                </div>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="total_views" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Total Views"
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="page_views" 
                        stroke="hsl(var(--chart-1))" 
                        strokeWidth={2}
                        name="Page Views"
                        dot={{ fill: 'hsl(var(--chart-1))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="blog_views" 
                        stroke="hsl(var(--chart-2))" 
                        strokeWidth={2}
                        name="Blog Views"
                        dot={{ fill: 'hsl(var(--chart-2))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="event_views" 
                        stroke="hsl(var(--chart-3))" 
                        strokeWidth={2}
                        name="Event Views"
                        dot={{ fill: 'hsl(var(--chart-3))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="unique_visitors" 
                        stroke="hsl(var(--chart-4))" 
                        strokeWidth={2}
                        name="Unique Visitors"
                        dot={{ fill: 'hsl(var(--chart-4))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold text-primary">
                    {chartData.reduce((sum, point) => sum + point.total_views, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Views</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold" style={{ color: 'hsl(var(--chart-1))' }}>
                    {chartData.reduce((sum, point) => sum + point.page_views, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Page Views</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold" style={{ color: 'hsl(var(--chart-2))' }}>
                    {chartData.reduce((sum, point) => sum + point.blog_views, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Blog Views</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold" style={{ color: 'hsl(var(--chart-3))' }}>
                    {chartData.reduce((sum, point) => sum + point.event_views, 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">Event Views</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Top Pages</CardTitle>
                <CardDescription>
                  Most viewed pages on your website
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.most_viewed_pages.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No page data available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData?.most_viewed_pages.slice(0, 5).map((page, index) => (
                      <div key={page.page_path} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium truncate block">
                              {page.page_title || page.page_path}
                            </span>
                            <span className="text-xs text-muted-foreground truncate block">
                              {page.page_path}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm font-medium">{page.total_views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Blog Posts</CardTitle>
                <CardDescription>
                  Most viewed blog content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.most_viewed_blogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No blog data available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData?.most_viewed_blogs.slice(0, 5).map((blog, index) => (
                      <div key={blog.blog_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm truncate max-w-32">
                            {blog.title}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{blog.total_views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
                <CardDescription>
                  Most viewed events
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData?.most_viewed_events.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No event data available.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analyticsData?.most_viewed_events.slice(0, 5).map((event, index) => (
                      <div key={event.event_id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="w-6 h-6 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm truncate max-w-32">
                            {event.title}
                          </span>
                        </div>
                        <span className="text-sm font-medium">{event.total_views}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Daily Activity</CardTitle>
              <CardDescription>
                Daily breakdown of website activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dailyViewsArray.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No daily data available for the selected period.
                </p>
              ) : (
                <div className="space-y-4">
                  {dailyViewsArray.slice(0, 7).map((day) => (
                    <div key={day.date} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium">
                          {new Date(day.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </h3>
                        <Badge variant="outline">
                          {day.page_views + day.blog_views + day.event_views} total views
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold">{day.page_views}</div>
                          <div className="text-xs text-muted-foreground">Page Views</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{day.blog_views}</div>
                          <div className="text-xs text-muted-foreground">Blog Views</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold">{day.event_views}</div>
                          <div className="text-xs text-muted-foreground">Event Views</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}