-- Fix function search path security issues
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_unique_slug(base_slug text, table_name text, record_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  final_slug text := base_slug;
  counter integer := 1;
  slug_exists boolean;
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
    END IF;
    
    -- If slug doesn't exist, we can use it
    IF NOT slug_exists THEN
      EXIT;
    END IF;
    
    -- Otherwise, append counter and try again
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Generate base slug from title
  NEW.slug := ensure_unique_slug(
    generate_slug(NEW.title), 
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
  );
  RETURN NEW;
END;
$$;