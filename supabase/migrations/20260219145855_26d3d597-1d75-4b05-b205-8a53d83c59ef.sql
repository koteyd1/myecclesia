
-- Create churches table
CREATE TABLE public.churches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  denomination TEXT,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United Kingdom',
  mission_statement TEXT,
  services_offered TEXT[],
  service_times TEXT,
  pastor_name TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  logo_url TEXT,
  banner_url TEXT,
  social_media_links JSONB DEFAULT '{}'::jsonb,
  safeguarding_contact TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on slug
ALTER TABLE public.churches ADD CONSTRAINT churches_slug_unique UNIQUE (slug);

-- Enable RLS
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view verified churches"
  ON public.churches FOR SELECT
  USING (is_verified = true);

CREATE POLICY "Users can view their own churches"
  ON public.churches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all churches"
  ON public.churches FOR SELECT
  USING (is_admin_user());

CREATE POLICY "Users can create their own church"
  ON public.churches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own church"
  ON public.churches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any church"
  ON public.churches FOR UPDATE
  USING (is_admin_user());

CREATE POLICY "Admins can delete churches"
  ON public.churches FOR DELETE
  USING (is_admin_user());

-- Add trigger for updated_at
CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add slug generation support
-- Update the ensure_unique_slug function to support churches
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
  max_attempts integer := 100;
BEGIN
  LOOP
    IF table_name = 'events' THEN
      SELECT EXISTS(SELECT 1 FROM public.events WHERE slug = final_slug AND (record_id IS NULL OR id != record_id)) INTO slug_exists;
    ELSIF table_name = 'blog_posts' THEN
      SELECT EXISTS(SELECT 1 FROM public.blog_posts WHERE slug = final_slug AND (record_id IS NULL OR id != record_id)) INTO slug_exists;
    ELSIF table_name = 'organizations' THEN
      SELECT EXISTS(SELECT 1 FROM public.organizations WHERE slug = final_slug AND (record_id IS NULL OR id != record_id)) INTO slug_exists;
    ELSIF table_name = 'ministers' THEN
      SELECT EXISTS(SELECT 1 FROM public.ministers WHERE slug = final_slug AND (record_id IS NULL OR id != record_id)) INTO slug_exists;
    ELSIF table_name = 'churches' THEN
      SELECT EXISTS(SELECT 1 FROM public.churches WHERE slug = final_slug AND (record_id IS NULL OR id != record_id)) INTO slug_exists;
    ELSE
      RETURN final_slug;
    END IF;
    
    IF NOT slug_exists THEN EXIT; END IF;
    IF counter > max_attempts THEN
      final_slug := base_slug || '-' || extract(epoch from now())::bigint;
      EXIT;
    END IF;
    
    final_slug := base_slug || '-' || counter;
    counter := counter + 1;
  END LOOP;
  
  RETURN final_slug;
END;
$function$;

-- Update auto_generate_slug to handle churches
CREATE OR REPLACE FUNCTION public.auto_generate_slug()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_TABLE_NAME = 'organizations' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.name), TG_TABLE_NAME, CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END);
  ELSIF TG_TABLE_NAME = 'ministers' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.full_name), TG_TABLE_NAME, CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END);
  ELSIF TG_TABLE_NAME = 'churches' THEN
    NEW.slug := ensure_unique_slug(generate_slug(NEW.name), TG_TABLE_NAME, CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END);
  ELSE
    NEW.slug := ensure_unique_slug(generate_slug(NEW.title), TG_TABLE_NAME, CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END);
  END IF;
  RETURN NEW;
END;
$function$;

-- Add auto slug trigger for churches
CREATE TRIGGER auto_generate_church_slug
  BEFORE INSERT OR UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_slug();

-- Add church_followers table
CREATE TABLE public.church_followers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  church_id UUID NOT NULL REFERENCES public.churches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(church_id, user_id)
);

ALTER TABLE public.church_followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can follow churches"
  ON public.church_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow churches"
  ON public.church_followers FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own follows"
  ON public.church_followers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all follows"
  ON public.church_followers FOR SELECT
  USING (is_admin_user());

-- Allow events to reference churches
ALTER TABLE public.events ADD COLUMN church_id UUID REFERENCES public.churches(id);
