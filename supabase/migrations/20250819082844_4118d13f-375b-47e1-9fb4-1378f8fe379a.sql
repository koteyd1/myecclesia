-- Create function to clean admin data from analytics
CREATE OR REPLACE FUNCTION public.cleanup_admin_analytics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow admins to run this cleanup
  IF NOT is_admin_user() THEN
    RAISE EXCEPTION 'Only admins can clean analytics data';
  END IF;

  -- Delete page analytics from admin users
  DELETE FROM public.page_analytics 
  WHERE user_id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  );
  
  -- Delete blog analytics from admin users  
  DELETE FROM public.blog_analytics 
  WHERE user_id IN (
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  );
  
  -- Delete event analytics isn't needed since it doesn't track user_id the same way
  
  RAISE NOTICE 'Admin analytics data cleaned successfully';
END;
$function$;