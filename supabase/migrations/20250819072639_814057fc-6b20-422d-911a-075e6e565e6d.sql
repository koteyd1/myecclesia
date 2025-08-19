-- Modify analytics functions to exclude admin users from tracking

-- Update the increment_page_view function to exclude admins
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
  -- Skip tracking for admin users
  IF user_id_param IS NOT NULL AND is_admin_user() THEN
    RETURN;
  END IF;

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

-- Update the increment_blog_view function to exclude admins
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
  -- Skip tracking for admin users
  IF user_id_param IS NOT NULL AND is_admin_user() THEN
    RETURN;
  END IF;

  INSERT INTO public.blog_analytics (blog_post_id, user_id, session_id, view_date, view_count)
  VALUES (blog_post_id_param, user_id_param, session_id_param, CURRENT_DATE, 1)
  ON CONFLICT (blog_post_id, session_id, view_date) 
  DO UPDATE SET 
    view_count = public.blog_analytics.view_count + 1,
    updated_at = NOW();
END;
$$;

-- Update the increment_event_view function to exclude admins
CREATE OR REPLACE FUNCTION public.increment_event_view(event_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Skip tracking for admin users
  IF auth.uid() IS NOT NULL AND is_admin_user() THEN
    RETURN;
  END IF;

  INSERT INTO public.event_analytics (event_id, view_date, view_count)
  VALUES (event_id_param, CURRENT_DATE, 1)
  ON CONFLICT (event_id, view_date) 
  DO UPDATE SET 
    view_count = public.event_analytics.view_count + 1,
    updated_at = NOW();
END;
$$;

-- Create function to get daily analytics for charting
CREATE OR REPLACE FUNCTION public.get_daily_analytics_chart(
  days_back integer DEFAULT 30
)
RETURNS TABLE(
  date date,
  page_views bigint,
  blog_views bigint,
  event_views bigint,
  unique_visitors bigint,
  total_views bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH date_series AS (
    SELECT generate_series(
      CURRENT_DATE - days_back,
      CURRENT_DATE,
      '1 day'::interval
    )::date AS date
  ),
  daily_page_views AS (
    SELECT 
      pa.view_date,
      SUM(pa.view_count) as page_views,
      COUNT(DISTINCT COALESCE(pa.session_id, pa.ip_address::text)) as unique_visitors
    FROM public.page_analytics pa
    WHERE pa.view_date >= CURRENT_DATE - days_back
      AND pa.view_date <= CURRENT_DATE
      -- Exclude admin users from analytics
      AND (pa.user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = pa.user_id AND ur.role = 'admin'
      ))
    GROUP BY pa.view_date
  ),
  daily_blog_views AS (
    SELECT 
      ba.view_date,
      SUM(ba.view_count) as blog_views
    FROM public.blog_analytics ba
    WHERE ba.view_date >= CURRENT_DATE - days_back
      AND ba.view_date <= CURRENT_DATE
      -- Exclude admin users from analytics
      AND (ba.user_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = ba.user_id AND ur.role = 'admin'
      ))
    GROUP BY ba.view_date
  ),
  daily_event_views AS (
    SELECT 
      ea.view_date,
      SUM(ea.view_count) as event_views
    FROM public.event_analytics ea
    WHERE ea.view_date >= CURRENT_DATE - days_back
      AND ea.view_date <= CURRENT_DATE
    GROUP BY ea.view_date
  )
  SELECT 
    ds.date,
    COALESCE(dpv.page_views, 0) as page_views,
    COALESCE(dbv.blog_views, 0) as blog_views,
    COALESCE(dev.event_views, 0) as event_views,
    COALESCE(dpv.unique_visitors, 0) as unique_visitors,
    COALESCE(dpv.page_views, 0) + COALESCE(dbv.blog_views, 0) + COALESCE(dev.event_views, 0) as total_views
  FROM date_series ds
  LEFT JOIN daily_page_views dpv ON ds.date = dpv.view_date
  LEFT JOIN daily_blog_views dbv ON ds.date = dbv.view_date
  LEFT JOIN daily_event_views dev ON ds.date = dev.view_date
  ORDER BY ds.date;
$$;