-- Drop and recreate the INSERT policy for organizations with more permissive check
DROP POLICY IF EXISTS "Users can create their own organization" ON public.organizations;

-- Create a more robust INSERT policy that properly handles authenticated users
CREATE POLICY "Users can create their own organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure the policy works by checking for any conflicting restrictive policies
-- The issue might be that we have a deny policy blocking inserts
-- Let's also make sure there's no conflicting ALL policy

-- Verify the user can see their own unverified organizations
DROP POLICY IF EXISTS "Users can view their own organizations" ON public.organizations;
CREATE POLICY "Users can view their own organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);