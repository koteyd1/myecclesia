-- Fix donation data exposure - first check what policies exist and recreate them properly

-- Drop all existing donation SELECT policies to recreate them securely
DROP POLICY IF EXISTS "users_view_own_donations" ON public.donations;
DROP POLICY IF EXISTS "admins_view_all_donations" ON public.donations;
DROP POLICY IF EXISTS "secure_donations_select" ON public.donations;
DROP POLICY IF EXISTS "deny_anonymous_donation_access" ON public.donations;

-- Create ONE comprehensive SELECT policy that handles all access securely
CREATE POLICY "comprehensive_donations_select" 
ON public.donations 
FOR SELECT 
USING (
  -- Only allow access if:
  -- 1. User is admin (can see all donations), OR
  -- 2. User is authenticated AND viewing their own donation (user_id matches and is not null)
  -- This explicitly denies access to anonymous donations for non-admin users
  is_admin_user() 
  OR 
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND user_id IS NOT NULL)
);

-- Update the UPDATE policy to be more explicit
DROP POLICY IF EXISTS "users_update_own_donations" ON public.donations;
DROP POLICY IF EXISTS "secure_donations_update" ON public.donations;

CREATE POLICY "comprehensive_donations_update" 
ON public.donations 
FOR UPDATE 
USING (
  -- Same logic as SELECT - only admins or donation owners
  is_admin_user() 
  OR 
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND user_id IS NOT NULL)
)
WITH CHECK (
  -- Ensure updates maintain the same security constraints
  is_admin_user() 
  OR 
  (auth.uid() IS NOT NULL AND auth.uid() = user_id AND user_id IS NOT NULL)
);

-- Add comprehensive audit logging for sensitive donation access
CREATE OR REPLACE FUNCTION public.audit_donation_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log all access to donation data, especially anonymous donations
  INSERT INTO public.admin_audit_log (
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    auth.uid(),
    CASE 
      WHEN OLD.user_id IS NULL OR NEW.user_id IS NULL THEN CONCAT(TG_OP, '_ANONYMOUS_DONATION')
      ELSE TG_OP
    END,
    'donations',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Update the existing trigger to use the new function
DROP TRIGGER IF EXISTS audit_donation_access_trigger ON public.donations;
DROP TRIGGER IF EXISTS audit_anonymous_donation_access_trigger ON public.donations;

CREATE TRIGGER audit_donation_access_trigger
  AFTER SELECT OR INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_donation_access();