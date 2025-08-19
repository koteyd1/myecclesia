-- Create comprehensive site analytics tables for admin tracking

-- Table for tracking page views across the site
CREATE TABLE public.page_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path text NOT NULL,
  page_title text,
  user_id uuid,  -- Can be null for anonymous users
  session_id text,  -- Track unique sessions
  ip_address inet,  -- For unique visitor tracking
  user_agent text,
  referrer text,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for page analytics
CREATE POLICY "Only admins can view page analytics"
  ON public.page_analytics
  FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Anyone can insert page analytics"
  ON public.page_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only system can update page analytics"
  ON public.page_analytics
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX idx_page_analytics_page_path ON public.page_analytics(page_path);
CREATE INDEX idx_page_analytics_view_date ON public.page_analytics(view_date);
CREATE INDEX idx_page_analytics_user_id ON public.page_analytics(user_id);
CREATE INDEX idx_page_analytics_session_id ON public.page_analytics(session_id);

-- Table for tracking blog post analytics
CREATE TABLE public.blog_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blog_post_id uuid NOT NULL,
  user_id uuid,  -- Can be null for anonymous users
  session_id text,
  view_date date NOT NULL DEFAULT CURRENT_DATE,
  view_count integer NOT NULL DEFAULT 1,
  time_spent_seconds integer DEFAULT 0,  -- Track engagement time
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blog_post_id, session_id, view_date)
);

-- Enable RLS
ALTER TABLE public.blog_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for blog analytics
CREATE POLICY "Only admins can view blog analytics"
  ON public.blog_analytics
  FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Anyone can insert blog analytics"
  ON public.blog_analytics
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update blog analytics for engagement tracking"
  ON public.blog_analytics
  FOR UPDATE
  USING (true);

-- Create indexes
CREATE INDEX idx_blog_analytics_blog_post_id ON public.blog_analytics(blog_post_id);
CREATE INDEX idx_blog_analytics_view_date ON public.blog_analytics(view_date);
CREATE INDEX idx_blog_analytics_session_id ON public.blog_analytics(session_id);

-- Function to increment page views
CREATE OR REPLACE FUNCTION public.increment_page_view(
  page_path_param text,
  page_title_param text DEFAULT NULL,
  user_id_param uuid DEFAULT NULL,
  session_id_param text DEFAULT NULL,
  ip_address_param inet DEFAULT NULL,
  user_agent_param text DEFAULT NULL,
  referrer_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.page_analytics (
    page_path, page_title, user_id, session_id, ip_address, user_agent, referrer, view_date, view_count
  )
  VALUES (
    page_path_param, page_title_param, user_id_param, session_id_param, 
    ip_address_param, user_agent_param, referrer_param, CURRENT_DATE, 1
  )
  ON CONFLICT (page_path, session_id, view_date) 
  DO UPDATE SET 
    view_count = public.page_analytics.view_count + 1,
    updated_at = NOW();
END;
$$;

-- Function to increment blog views
CREATE OR REPLACE FUNCTION public.increment_blog_view(
  blog_post_id_param uuid,
  user_id_param uuid DEFAULT NULL,
  session_id_param text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.blog_analytics (blog_post_id, user_id, session_id, view_date, view_count)
  VALUES (blog_post_id_param, user_id_param, session_id_param, CURRENT_DATE, 1)
  ON CONFLICT (blog_post_id, session_id, view_date) 
  DO UPDATE SET 
    view_count = public.blog_analytics.view_count + 1,
    updated_at = NOW();
END;
$$;

-- Function to get comprehensive site analytics for admins
CREATE OR REPLACE FUNCTION public.get_site_analytics_summary(
  days_back integer DEFAULT 30
)
RETURNS TABLE(
  total_page_views bigint,
  unique_visitors bigint,
  total_sessions bigint,
  total_blog_views bigint,
  total_event_views bigint,
  total_registrations bigint,
  most_viewed_pages jsonb,
  most_viewed_blogs jsonb,
  most_viewed_events jsonb,
  daily_views jsonb
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH date_range AS (
    SELECT CURRENT_DATE - days_back AS start_date, CURRENT_DATE AS end_date
  ),
  page_stats AS (
    SELECT 
      SUM(view_count) as total_page_views,
      COUNT(DISTINCT COALESCE(session_id, ip_address::text)) as unique_visitors,
      COUNT(DISTINCT session_id) as total_sessions
    FROM public.page_analytics pa, date_range dr
    WHERE pa.view_date >= dr.start_date AND pa.view_date <= dr.end_date
  ),
  blog_stats AS (
    SELECT SUM(view_count) as total_blog_views
    FROM public.blog_analytics ba, date_range dr
    WHERE ba.view_date >= dr.start_date AND ba.view_date <= dr.end_date
  ),
  event_stats AS (
    SELECT 
      SUM(view_count) as total_event_views,
      SUM(registration_count) as total_registrations
    FROM public.event_analytics ea, date_range dr
    WHERE ea.view_date >= dr.start_date AND ea.view_date <= dr.end_date
  ),
  top_pages AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'page_path', page_path,
        'page_title', page_title,
        'total_views', total_views
      ) ORDER BY total_views DESC
    ) as most_viewed_pages
    FROM (
      SELECT page_path, page_title, SUM(view_count) as total_views
      FROM public.page_analytics pa, date_range dr
      WHERE pa.view_date >= dr.start_date AND pa.view_date <= dr.end_date
      GROUP BY page_path, page_title
      ORDER BY total_views DESC
      LIMIT 10
    ) top_pages_data
  ),
  top_blogs AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'blog_id', bp.id,
        'title', bp.title,
        'total_views', ba_summary.total_views
      ) ORDER BY ba_summary.total_views DESC
    ) as most_viewed_blogs
    FROM (
      SELECT blog_post_id, SUM(view_count) as total_views
      FROM public.blog_analytics ba, date_range dr
      WHERE ba.view_date >= dr.start_date AND ba.view_date <= dr.end_date
      GROUP BY blog_post_id
      ORDER BY total_views DESC
      LIMIT 10
    ) ba_summary
    JOIN public.blog_posts bp ON bp.id = ba_summary.blog_post_id
  ),
  top_events AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'event_id', e.id,
        'title', e.title,
        'total_views', ea_summary.total_views
      ) ORDER BY ea_summary.total_views DESC
    ) as most_viewed_events
    FROM (
      SELECT event_id, SUM(view_count) as total_views
      FROM public.event_analytics ea, date_range dr
      WHERE ea.view_date >= dr.start_date AND ea.view_date <= dr.end_date
      GROUP BY event_id
      ORDER BY total_views DESC
      LIMIT 10
    ) ea_summary
    JOIN public.events e ON e.id = ea_summary.event_id
  ),
  daily_stats AS (
    SELECT jsonb_object_agg(
      view_date,
      jsonb_build_object(
        'page_views', COALESCE(page_views, 0),
        'blog_views', COALESCE(blog_views, 0),
        'event_views', COALESCE(event_views, 0)
      )
    ) as daily_views
    FROM (
      SELECT 
        d.view_date,
        SUM(CASE WHEN source = 'page' THEN views ELSE 0 END) as page_views,
        SUM(CASE WHEN source = 'blog' THEN views ELSE 0 END) as blog_views,
        SUM(CASE WHEN source = 'event' THEN views ELSE 0 END) as event_views
      FROM (
        SELECT view_date, SUM(view_count) as views, 'page' as source
        FROM public.page_analytics pa, date_range dr
        WHERE pa.view_date >= dr.start_date AND pa.view_date <= dr.end_date
        GROUP BY view_date
        
        UNION ALL
        
        SELECT view_date, SUM(view_count) as views, 'blog' as source
        FROM public.blog_analytics ba, date_range dr
        WHERE ba.view_date >= dr.start_date AND ba.view_date <= dr.end_date
        GROUP BY view_date
        
        UNION ALL
        
        SELECT view_date, SUM(view_count) as views, 'event' as source
        FROM public.event_analytics ea, date_range dr
        WHERE ea.view_date >= dr.start_date AND ea.view_date <= dr.end_date
        GROUP BY view_date
      ) d
      GROUP BY d.view_date
      ORDER BY d.view_date DESC
    ) daily_data
  )
  SELECT 
    COALESCE(ps.total_page_views, 0),
    COALESCE(ps.unique_visitors, 0),
    COALESCE(ps.total_sessions, 0),
    COALESCE(bs.total_blog_views, 0),
    COALESCE(es.total_event_views, 0),
    COALESCE(es.total_registrations, 0),
    COALESCE(tp.most_viewed_pages, '[]'::jsonb),
    COALESCE(tb.most_viewed_blogs, '[]'::jsonb),
    COALESCE(te.most_viewed_events, '[]'::jsonb),
    COALESCE(ds.daily_views, '{}'::jsonb)
  FROM page_stats ps
  CROSS JOIN blog_stats bs
  CROSS JOIN event_stats es
  CROSS JOIN top_pages tp
  CROSS JOIN top_blogs tb
  CROSS JOIN top_events te
  CROSS JOIN daily_stats ds;
$$;

-- Add unique constraint for page analytics to prevent duplicates
ALTER TABLE public.page_analytics 
ADD CONSTRAINT unique_page_view_per_session_date 
UNIQUE (page_path, session_id, view_date);