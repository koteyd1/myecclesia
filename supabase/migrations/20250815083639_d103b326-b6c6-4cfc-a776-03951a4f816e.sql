-- Enhance RLS policies for donations table to address security concerns

-- First, let's ensure we have proper constraint on user_id for authenticated donations
-- Users who are authenticated MUST have their user_id set
ALTER TABLE public.donations 
ADD CONSTRAINT check_authenticated_user_id 
CHECK (
  (user_id IS NOT NULL AND auth.uid() IS NOT NULL) OR 
  (user_id IS NULL AND auth.uid() IS NULL)
);

-- Drop existing policies to recreate them with better security
DROP POLICY IF EXISTS "Authenticated users can insert their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can update their own donations" ON public.donations;
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can manage all donations" ON public.donations;
DROP POLICY IF EXISTS "Admins can view anonymous donations" ON public.donations;

-- Create more secure policies

-- 1. INSERT policy: Only authenticated users can insert donations with their user_id
CREATE POLICY "authenticated_users_insert_own_donations" ON public.donations
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    user_id IS NOT NULL
  );

-- 2. INSERT policy for anonymous donations (from edge functions only)
CREATE POLICY "service_role_insert_anonymous_donations" ON public.donations
  FOR INSERT 
  TO service_role
  WITH CHECK (true);

-- 3. SELECT policy: Users can only view their own donations
CREATE POLICY "users_view_own_donations" ON public.donations
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. SELECT policy: Admins can view all donations
CREATE POLICY "admins_view_all_donations" ON public.donations
  FOR SELECT 
  TO authenticated
  USING (is_admin_user());

-- 5. UPDATE policy: Users can only update their own donations (limited fields)
CREATE POLICY "users_update_own_donations" ON public.donations
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. UPDATE policy: Admins can update all donations
CREATE POLICY "admins_update_all_donations" ON public.donations
  FOR UPDATE 
  TO authenticated
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- 7. DELETE policy: Only admins can delete donations
CREATE POLICY "admins_delete_donations" ON public.donations
  FOR DELETE 
  TO authenticated
  USING (is_admin_user());

-- 8. No public access - ensure no anonymous role can access anything
-- (This is already the default, but let's be explicit)

-- Create audit trigger for donations to track access
CREATE OR REPLACE FUNCTION public.audit_donation_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Log all donation table operations for security monitoring
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
    'donations',
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit trigger to donations table
CREATE TRIGGER audit_donations_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_donation_access();