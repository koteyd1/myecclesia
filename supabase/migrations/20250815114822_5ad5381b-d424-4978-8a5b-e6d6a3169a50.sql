-- Add slug columns to events and blog_posts tables
ALTER TABLE public.events ADD COLUMN slug text;
ALTER TABLE public.blog_posts ADD COLUMN slug text;

-- Create unique indexes on slug columns
CREATE UNIQUE INDEX idx_events_slug ON public.events(slug);
CREATE UNIQUE INDEX idx_blog_posts_slug ON public.blog_posts(slug);

-- Create a function to generate SEO-friendly slugs
CREATE OR REPLACE FUNCTION public.generate_slug(input_text text)
RETURNS text
LANGUAGE plpgsql
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

-- Create a function to ensure unique slugs
CREATE OR REPLACE FUNCTION public.ensure_unique_slug(base_slug text, table_name text, record_id uuid DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
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

-- Create triggers to automatically generate slugs on insert/update
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
RETURNS trigger
LANGUAGE plpgsql
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

-- Add triggers for both tables
CREATE TRIGGER events_auto_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_slug();

CREATE TRIGGER blog_posts_auto_slug_trigger
  BEFORE INSERT OR UPDATE OF title ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_slug();

-- Update existing events with slugs
UPDATE public.events 
SET slug = ensure_unique_slug(generate_slug(title), 'events', id)
WHERE slug IS NULL;

-- Update existing blog posts with slugs
UPDATE public.blog_posts 
SET slug = ensure_unique_slug(generate_slug(title), 'blog_posts', id)
WHERE slug IS NULL;

-- Make slug columns NOT NULL after populating them
ALTER TABLE public.events ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.blog_posts ALTER COLUMN slug SET NOT NULL;