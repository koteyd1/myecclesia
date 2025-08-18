-- Fix the auto_generate_slug function to handle different table structures
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Generate base slug from title or name depending on the table
  IF TG_TABLE_NAME = 'organizations' THEN
    NEW.slug := ensure_unique_slug(
      generate_slug(NEW.name), 
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
  ELSE
    -- For other tables that use title
    NEW.slug := ensure_unique_slug(
      generate_slug(NEW.title), 
      TG_TABLE_NAME,
      CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- Create trigger for organizations table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_auto_generate_slug' 
    AND tgrelid = 'public.organizations'::regclass
  ) THEN
    CREATE TRIGGER trigger_auto_generate_slug
      BEFORE INSERT OR UPDATE ON public.organizations
      FOR EACH ROW EXECUTE FUNCTION public.auto_generate_slug();
  END IF;
END $$;