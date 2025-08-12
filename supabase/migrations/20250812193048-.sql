-- Security hardening migration
-- 1) Ensure RLS is enabled and correct policies for sensitive tables

-- Enable RLS on pages and files (idempotent)
ALTER TABLE IF EXISTS public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;

-- Drop overly permissive policy on pages if it exists and replace with admin-only management
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='pages' 
      AND policyname='Allow authenticated users to manage their own pages'
  ) THEN
    EXECUTE 'DROP POLICY "Allow authenticated users to manage their own pages" ON public.pages';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='pages' 
      AND policyname='Admins can manage pages'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can manage pages" ON public.pages FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user())';
  END IF;
END$$;

-- Fix files policy to admin-only
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='files' 
      AND policyname='Org admins can manage files'
  ) THEN
    EXECUTE 'DROP POLICY "Org admins can manage files" ON public.files';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='files' 
      AND policyname='Only admins can manage files'
  ) THEN
    EXECUTE 'CREATE POLICY "Only admins can manage files" ON public.files FOR ALL USING (is_admin_user()) WITH CHECK (is_admin_user())';
  END IF;
END$$;

-- 2) Ensure contact_messages read access is admins-only (idempotent)
ALTER TABLE IF EXISTS public.contact_messages ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='contact_messages' 
      AND policyname='Only admins can view contact messages'
  ) THEN
    EXECUTE 'CREATE POLICY "Only admins can view contact messages" ON public.contact_messages FOR SELECT USING (is_admin_user())';
  END IF;
END$$;

-- 3) Validation triggers
-- Donations validation triggers using existing function
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_donations_before_insert'
  ) THEN
    CREATE TRIGGER validate_donations_before_insert
    BEFORE INSERT ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.validate_donation_input();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_donations_before_update'
  ) THEN
    CREATE TRIGGER validate_donations_before_update
    BEFORE UPDATE ON public.donations
    FOR EACH ROW EXECUTE FUNCTION public.validate_donation_input();
  END IF;
END$$;

-- Contact message input validation function + triggers
CREATE OR REPLACE FUNCTION public.validate_contact_message_input()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NEW.email IS NULL OR NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF NEW.name IS NULL OR length(NEW.name) = 0 OR length(NEW.name) > 100 THEN
    RAISE EXCEPTION 'Invalid name';
  END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone !~ '^[0-9\s()\-+]+$' THEN
    RAISE EXCEPTION 'Invalid phone';
  END IF;
  IF NEW.message IS NULL OR length(NEW.message) = 0 OR length(NEW.message) > 2000 THEN
    RAISE EXCEPTION 'Invalid message';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_contact_messages_before_insert'
  ) THEN
    CREATE TRIGGER validate_contact_messages_before_insert
    BEFORE INSERT ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message_input();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'validate_contact_messages_before_update'
  ) THEN
    CREATE TRIGGER validate_contact_messages_before_update
    BEFORE UPDATE ON public.contact_messages
    FOR EACH ROW EXECUTE FUNCTION public.validate_contact_message_input();
  END IF;
END$$;

-- 4) Audit triggers on admin-managed tables
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_events_changes') THEN
    CREATE TRIGGER audit_events_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_blog_posts_changes') THEN
    CREATE TRIGGER audit_blog_posts_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_user_roles_changes') THEN
    CREATE TRIGGER audit_user_roles_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_pages_changes') THEN
    CREATE TRIGGER audit_pages_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.pages
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'audit_files_changes') THEN
    CREATE TRIGGER audit_files_changes
    AFTER INSERT OR UPDATE OR DELETE ON public.files
    FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();
  END IF;
END$$;