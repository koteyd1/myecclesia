-- Create a table to track event views/analytics
CREATE TABLE IF NOT EXISTS public.event_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER DEFAULT 0,
  registration_count INTEGER DEFAULT 0,
  calendar_add_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.event_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for event analytics
CREATE POLICY "Admins can view all event analytics"
  ON public.event_analytics FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Event creators can view their event analytics"
  ON public.event_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_analytics.event_id 
      AND e.created_by = auth.uid()
    )
  );

CREATE POLICY "Only system can insert/update analytics"
  ON public.event_analytics FOR ALL
  USING (auth.role() = 'service_role');

-- Create function to get event analytics for organizers
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
) LANGUAGE SQL SECURITY DEFINER AS $$
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

-- Create function to get analytics summary for an organizer
CREATE OR REPLACE FUNCTION public.get_organizer_analytics_summary(organizer_id UUID)
RETURNS TABLE(
  total_events BIGINT,
  total_views BIGINT,
  total_registrations BIGINT,
  avg_registration_rate NUMERIC,
  upcoming_events BIGINT
) LANGUAGE SQL SECURITY DEFINER AS $$
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

-- Create function to increment event views (will be called when event is viewed)
CREATE OR REPLACE FUNCTION public.increment_event_view(event_id_param UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.event_analytics (event_id, view_date, view_count)
  VALUES (event_id_param, CURRENT_DATE, 1)
  ON CONFLICT (event_id, view_date) 
  DO UPDATE SET 
    view_count = public.event_analytics.view_count + 1,
    updated_at = NOW();
END;
$$;

-- Add unique constraint for proper upsert behavior
ALTER TABLE public.event_analytics 
ADD CONSTRAINT unique_event_analytics_per_day 
UNIQUE (event_id, view_date);

-- Create trigger to update updated_at
CREATE TRIGGER update_event_analytics_updated_at
  BEFORE UPDATE ON public.event_analytics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();