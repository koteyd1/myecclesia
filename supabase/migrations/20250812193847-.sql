-- Security fixes migration: validation, auditing, and RLS tightening

-- 1) Harden functions with explicit search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_admin_actions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only audit if performed by admin
  IF EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  ) THEN
    INSERT INTO public.admin_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 2) Input validation triggers
DROP TRIGGER IF EXISTS trg_validate_donations ON public.donations;
CREATE TRIGGER trg_validate_donations
BEFORE INSERT OR UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.validate_donation_input();

DROP TRIGGER IF EXISTS trg_validate_contact_messages ON public.contact_messages;
CREATE TRIGGER trg_validate_contact_messages
BEFORE INSERT OR UPDATE ON public.contact_messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_contact_message_input();

-- 3) Admin audit triggers on key tables
DROP TRIGGER IF EXISTS trg_audit_events ON public.events;
CREATE TRIGGER trg_audit_events
AFTER INSERT OR UPDATE OR DELETE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

DROP TRIGGER IF EXISTS trg_audit_blog_posts ON public.blog_posts;
CREATE TRIGGER trg_audit_blog_posts
AFTER INSERT OR UPDATE OR DELETE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

DROP TRIGGER IF EXISTS trg_audit_files ON public.files;
CREATE TRIGGER trg_audit_files
AFTER INSERT OR UPDATE OR DELETE ON public.files
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

DROP TRIGGER IF EXISTS trg_audit_pages ON public.pages;
CREATE TRIGGER trg_audit_pages
AFTER INSERT OR UPDATE OR DELETE ON public.pages
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

DROP TRIGGER IF EXISTS trg_audit_event_registrations ON public.event_registrations;
CREATE TRIGGER trg_audit_event_registrations
AFTER INSERT OR UPDATE OR DELETE ON public.event_registrations
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

DROP TRIGGER IF EXISTS trg_audit_donations ON public.donations;
CREATE TRIGGER trg_audit_donations
AFTER INSERT OR UPDATE OR DELETE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.audit_admin_actions();

-- 4) Tighten donations SELECT policy to user_id only
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations"
ON public.donations
FOR SELECT
USING (auth.uid() = user_id);
