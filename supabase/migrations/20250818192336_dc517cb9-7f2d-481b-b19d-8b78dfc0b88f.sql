-- Fix function search path security warnings by setting explicit search_path
DROP FUNCTION IF EXISTS public.get_event_organizer_analytics(UUID);
DROP FUNCTION IF EXISTS public.get_organizer_analytics_summary(UUID);
DROP FUNCTION IF EXISTS public.increment_event_view(UUID);

-- Create function to get event analytics for organizers with secure search path
CREATE OR REPLACE FUNCTION public.get_event_organizer_analytics(organizer_id UUID)
RETURNS TABLE(
  event_id UUID,
  event_title TEXT,
  event_date DATE,
  total_views BIGINT,
  total_registrations BIGINT,
  total_calendar_adds BIGINT,
  recent_views BIGINT,
  registration_rate NUMERIC
) LANGUAGE SQL SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    e.id as event_id,
    e.title as event_title,
    e.date as event_date,
    COALESCE(SUM(ea.view_count), 0) as total_views,
    (SELECT COUNT(*) FROM public.event_registrations er WHERE er.event_id = e.id) as total_registrations,
    (SELECT COUNT(*) FROM public.user_calendar uc WHERE uc.event_id = e.id) as total_calendar_adds,
    COALESCE(SUM(CASE WHEN ea.view_date >= CURRENT_DATE - INTERVAL '7 days' THEN ea.view_count ELSE 0 END), 0) as recent_views,
    CASE 
      WHEN COALESCE(SUM(ea.view_count), 0) > 0 
      THEN ROUND((SELECT COUNT(*) FROM public.event_registrations er WHERE er.event_id = e.id)::NUMERIC / SUM(ea.view_count) * 100, 2)
      ELSE 0
    END as registration_rate
  FROM public.events e
  LEFT JOIN public.event_analytics ea ON e.id = ea.event_id
  WHERE e.created_by = organizer_id
  GROUP BY e.id, e.title, e.date
  ORDER BY e.date DESC;
$$;

-- Create function to get analytics summary for an organizer with secure search path
CREATE OR REPLACE FUNCTION public.get_organizer_analytics_summary(organizer_id UUID)
RETURNS TABLE(
  total_events BIGINT,
  total_views BIGINT,
  total_registrations BIGINT,
  avg_registration_rate NUMERIC,
  upcoming_events BIGINT
) LANGUAGE SQL SECURITY DEFINER 
SET search_path = public
AS $$
  SELECT 
    COUNT(DISTINCT e.id) as total_events,
    COALESCE(SUM(ea.view_count), 0) as total_views,
    (SELECT COUNT(*) FROM public.event_registrations er 
     JOIN public.events e2 ON er.event_id = e2.id 
     WHERE e2.created_by = organizer_id) as total_registrations,
    CASE 
      WHEN COALESCE(SUM(ea.view_count), 0) > 0 
      THEN ROUND((SELECT COUNT(*) FROM public.event_registrations er 
                  JOIN public.events e2 ON er.event_id = e2.id 
                  WHERE e2.created_by = organizer_id)::NUMERIC / SUM(ea.view_count) * 100, 2)
      ELSE 0
    END as avg_registration_rate,
    COUNT(DISTINCT CASE WHEN e.date >= CURRENT_DATE THEN e.id END) as upcoming_events
  FROM public.events e
  LEFT JOIN public.event_analytics ea ON e.id = ea.event_id
  WHERE e.created_by = organizer_id;
$$;

-- Create function to increment event views with secure search path
CREATE OR REPLACE FUNCTION public.increment_event_view(event_id_param UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.event_analytics (event_id, view_date, view_count)
  VALUES (event_id_param, CURRENT_DATE, 1)
  ON CONFLICT (event_id, view_date) 
  DO UPDATE SET 
    view_count = public.event_analytics.view_count + 1,
    updated_at = NOW();
END;
$$;