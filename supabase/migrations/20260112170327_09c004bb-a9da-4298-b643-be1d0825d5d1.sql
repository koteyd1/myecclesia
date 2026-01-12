-- Update ensure_unique_slug function to handle ministers table
CREATE OR REPLACE FUNCTION public.ensure_unique_slug(base_slug text, table_name text, record_id uuid DEFAULT NULL::uuid)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  final_slug text := base_slug;
  counter integer := 1;
  slug_exists boolean;
  max_attempts integer := 100; -- Prevent infinite loops
BEGIN
  LOOP
    -- Check if slug exists in the specified table (excluding current record if updating)
    IF table_name = 'events' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.events 
        WHERE slug = final_slug 
        AND (record_id IS NULL OR id != record_id)
      ) INTO slug_exists;
    ELSIF table_name = 'blog_posts' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.blog_posts 
        WHERE slug = final_slug 
        AND (record_id IS NULL OR id != record_id)
      ) INTO slug_exists;
    ELSIF table_name = 'organizations' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.organizations 
        WHERE slug = final_slug 
        AND (record_id IS NULL OR id != record_id)
      ) INTO slug_exists;
    ELSIF table_name = 'ministers' THEN
      SELECT EXISTS(
        SELECT 1 FROM public.ministers 
        WHERE slug = final_slug 
        AND (record_id IS NULL OR id != record_id)
      ) INTO slug_exists;
    ELSE
      -- Unknown table, return base slug
      RETURN final_slug;
    END IF;
    
    -- If slug doesn't exist, we can use it
    IF NOT slug_exists THEN
      EXIT;
    END IF;
    
    -- Safety check to prevent infinite loops
    IF counter > max_attempts THEN
      final_slug := base_slug || '-' || extract(epoch from now())::bigint;
      EXIT;
    END IF;
    
    -- Otherwise, append counter and try again
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;