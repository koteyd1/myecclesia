-- Add country and city columns to page_analytics for geographic tracking
ALTER TABLE public.page_analytics 
ADD COLUMN country text,
ADD COLUMN country_code text,
ADD COLUMN city text;

-- Create function to get visitor geographic data
CREATE OR REPLACE FUNCTION public.get_visitor_geography(days_back integer DEFAULT 30)
RETURNS TABLE(
  country text,
  country_code text,
  city text,
  visitor_count bigint,
  page_views bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    pa.country,
    pa.country_code,
    pa.city,
    COUNT(DISTINCT COALESCE(pa.session_id, pa.ip_address::text)) as visitor_count,
    SUM(pa.view_count) as page_views
  FROM public.page_analytics pa
  WHERE pa.view_date >= CURRENT_DATE - days_back
    AND pa.view_date <= CURRENT_DATE
    AND pa.country IS NOT NULL
    -- Exclude admin users from analytics
    AND (pa.user_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = pa.user_id AND ur.role = 'admin'
    ))
  GROUP BY pa.country, pa.country_code, pa.city
  ORDER BY visitor_count DESC, page_views DESC;
$function$;

-- Update increment_page_view function to accept country data
CREATE OR REPLACE FUNCTION public.increment_page_view(
  page_path_param text, 
  page_title_param text DEFAULT NULL::text, 
  user_id_param uuid DEFAULT NULL::uuid, 
  session_id_param text DEFAULT NULL::text, 
  ip_address_param inet DEFAULT NULL::inet, 
  user_agent_param text DEFAULT NULL::text, 
  referrer_param text DEFAULT NULL::text,
  country_param text DEFAULT NULL::text,
  country_code_param text DEFAULT NULL::text,
  city_param text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Skip tracking for admin users
  IF user_id_param IS NOT NULL AND is_admin_user() THEN
    RETURN;
  END IF;

  INSERT INTO public.page_analytics (
    page_path, page_title, user_id, session_id, ip_address, user_agent, referrer, 
    country, country_code, city, view_date, view_count
  )
  VALUES (
    page_path_param, page_title_param, user_id_param, session_id_param, 
    ip_address_param, user_agent_param, referrer_param,
    country_param, country_code_param, city_param, CURRENT_DATE, 1
  )
  ON CONFLICT (page_path, session_id, view_date) 
  DO UPDATE SET 
    view_count = public.page_analytics.view_count + 1,
    updated_at = NOW(),
    -- Update geographic data if not already set
    country = COALESCE(public.page_analytics.country, EXCLUDED.country),
    country_code = COALESCE(public.page_analytics.country_code, EXCLUDED.country_code),
    city = COALESCE(public.page_analytics.city, EXCLUDED.city);
END;
$function$;