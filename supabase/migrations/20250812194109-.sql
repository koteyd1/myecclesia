-- Strengthen RLS on donations: enforce user-only reads and add admin access

-- 1) Ensure user-only SELECT (kept from previous change)
DROP POLICY IF EXISTS "Users can view their own donations" ON public.donations;
CREATE POLICY "Users can view their own donations"
ON public.donations
FOR SELECT
USING (auth.uid() = user_id);

-- 2) Allow admins to view all donations
DROP POLICY IF EXISTS "Admins can view all donations" ON public.donations;
CREATE POLICY "Admins can view all donations"
ON public.donations
FOR SELECT
USING (is_admin_user());

-- 3) Allow admins to manage all donations (insert/update/delete)
DROP POLICY IF EXISTS "Admins can manage all donations" ON public.donations;
CREATE POLICY "Admins can manage all donations"
ON public.donations
FOR ALL
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Note: keep existing user INSERT/UPDATE policies for authenticated users
-- INSERT: WITH CHECK (auth.uid() = user_id)
-- UPDATE: USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)
