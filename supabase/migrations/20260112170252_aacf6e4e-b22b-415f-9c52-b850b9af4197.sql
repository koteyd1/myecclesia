-- Fix the auto_generate_slug function to handle ministers table (uses full_name, not title)
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate base slug from appropriate field depending on the table
  IF TG_TABLE_NAME = 'organizations' THEN
    NEW.slug := ensure_unique_slug(
      generate_slug(NEW.name), 
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
  ELSIF TG_TABLE_NAME = 'ministers' THEN
    NEW.slug := ensure_unique_slug(
      generate_slug(NEW.full_name), 
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
  ELSE
    -- For other tables that use title (events, blog_posts, etc.)
    NEW.slug := ensure_unique_slug(
      generate_slug(NEW.title), 
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;