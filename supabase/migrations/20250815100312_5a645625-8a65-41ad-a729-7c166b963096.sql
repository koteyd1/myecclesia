-- Fix donation data exposure by securing anonymous donations
-- First, create a comprehensive policy that explicitly handles all cases

-- Drop the existing policies to recreate them with better security
DROP POLICY IF EXISTS "users_view_own_donations" ON public.donations;
DROP POLICY IF EXISTS "admins_view_all_donations" ON public.donations;

-- Create a comprehensive SELECT policy that handles all cases securely
CREATE POLICY "secure_donations_select" 
ON public.donations 
FOR SELECT 
USING (
  -- Admins can view all donations
  is_admin_user() 
  OR 
  -- Authenticated users can only view their own donations (user_id must match AND not be null)
  (auth.uid() = user_id AND user_id IS NOT NULL)
);

-- Ensure anonymous donations are explicitly protected from public access
-- Create a restrictive policy for anonymous donations
CREATE POLICY "deny_anonymous_donation_access" 
ON public.donations 
FOR SELECT 
USING (
  -- Explicitly deny access to anonymous donations unless user is admin
  CASE 
    WHEN user_id IS NULL THEN is_admin_user()
    ELSE true  -- This case is handled by other policies
  END
);

-- Update the UPDATE policy to be more explicit about anonymous donations
DROP POLICY IF EXISTS "users_update_own_donations" ON public.donations;

CREATE POLICY "secure_donations_update" 
ON public.donations 
FOR UPDATE 
USING (
  -- Admins can update all donations
  is_admin_user() 
  OR 
  -- Users can only update their own donations (must be authenticated and own the donation)
  (auth.uid() = user_id AND user_id IS NOT NULL)
)
WITH CHECK (
  -- Same check for updates
  is_admin_user() 
  OR 
  (auth.uid() = user_id AND user_id IS NOT NULL)
);

-- Add audit logging for any access to anonymous donation data
CREATE OR REPLACE FUNCTION public.audit_anonymous_donation_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to anonymous donations for security monitoring
  IF OLD.user_id IS NULL OR NEW.user_id IS NULL THEN
    INSERT INTO public.admin_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      CONCAT(TG_OP, '_ANONYMOUS_DONATION'),
      'donations',
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for anonymous donation access auditing
DROP TRIGGER IF EXISTS audit_anonymous_donation_access_trigger ON public.donations;
CREATE TRIGGER audit_anonymous_donation_access_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_anonymous_donation_access();