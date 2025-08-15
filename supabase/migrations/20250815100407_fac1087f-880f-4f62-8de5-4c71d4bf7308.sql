-- Simplify donation RLS policies to eliminate complexity warnings
-- Remove the blanket deny policy and consolidate into cleaner, simpler policies

-- Remove all existing policies to start fresh
DROP POLICY IF EXISTS "admin_only_anonymous_donations" ON public.donations;
DROP POLICY IF EXISTS "users_view_own_authenticated_donations" ON public.donations;
DROP POLICY IF EXISTS "admins_view_all_donations" ON public.donations;
DROP POLICY IF EXISTS "deny_all_unauthorized_donation_access" ON public.donations;
DROP POLICY IF EXISTS "secure_donations_update" ON public.donations;

-- Create simple, clear policies

-- 1. SELECT policies - two simple conditions
CREATE POLICY "donations_select_access" 
ON public.donations 
FOR SELECT 
USING (
  -- Only allow access if user is admin OR user owns the donation (not anonymous)
  is_admin_user() OR (auth.uid() = user_id AND user_id IS NOT NULL)
);

-- 2. UPDATE policy
CREATE POLICY "donations_update_access" 
ON public.donations 
FOR UPDATE 
USING (
  is_admin_user() OR (auth.uid() = user_id AND user_id IS NOT NULL)
)
WITH CHECK (
  is_admin_user() OR (auth.uid() = user_id AND user_id IS NOT NULL)
);

-- 3. DELETE policy (admins only)
-- Keep existing admin delete policy

-- 4. INSERT policies
-- Keep existing authenticated user and edge function policies

-- Verify the simplified policies work correctly
-- Anonymous donations (user_id IS NULL) will only be accessible to admins
-- Authenticated user donations will only be accessible to the owner or admins