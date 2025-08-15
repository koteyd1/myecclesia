-- Clean up duplicate SELECT policies on donations table

-- Drop the old policy that may be redundant
DROP POLICY IF EXISTS "donations_select_access" ON public.donations;

-- Verify we have the correct comprehensive policy in place
-- The comprehensive_donations_select policy should be the only SELECT policy needed