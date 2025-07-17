-- Fix the audit function to use text comparison instead of app_role enum
CREATE OR REPLACE FUNCTION public.audit_admin_actions()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit if performed by admin (using text comparison)
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now delete all example events and blog posts
DELETE FROM public.events;
DELETE FROM public.blog_posts;