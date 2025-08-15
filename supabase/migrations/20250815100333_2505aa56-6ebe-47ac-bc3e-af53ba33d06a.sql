-- Strengthen donation security with explicit deny-all policy for anonymous donations

-- Remove the complex conditional policy and create simpler, more explicit ones
DROP POLICY IF EXISTS "deny_anonymous_donation_access" ON public.donations;
DROP POLICY IF EXISTS "secure_donations_select" ON public.donations;

-- Create explicit policy that ONLY allows admin access to anonymous donations
CREATE POLICY "admin_only_anonymous_donations" 
ON public.donations 
FOR SELECT 
USING (
  user_id IS NULL AND is_admin_user()
);

-- Create policy for authenticated users to view their own donations
CREATE POLICY "users_view_own_authenticated_donations" 
ON public.donations 
FOR SELECT 
USING (
  user_id IS NOT NULL AND auth.uid() = user_id
);

-- Create policy for admins to view all donations (including authenticated ones)
CREATE POLICY "admins_view_all_donations" 
ON public.donations 
FOR SELECT 
USING (
  is_admin_user()
);

-- Create a restrictive default deny policy to ensure no unauthorized access
CREATE POLICY "deny_all_unauthorized_donation_access" 
ON public.donations 
FOR ALL
USING (false)
WITH CHECK (false);

-- Test the policies by attempting to access anonymous donations as non-admin
-- This should return 0 rows for non-admin users