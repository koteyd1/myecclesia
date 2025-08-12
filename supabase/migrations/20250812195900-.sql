-- Harden donations table protection for anonymous rows without changing behavior
-- 1) Ensure and force RLS so policies always apply
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations FORCE ROW LEVEL SECURITY;

-- 2) Add explicit admins-only policy for anonymous donations (user_id IS NULL)
DROP POLICY IF EXISTS "Admins can view anonymous donations" ON public.donations;
CREATE POLICY "Admins can view anonymous donations"
ON public.donations
FOR SELECT
USING (is_admin_user() AND user_id IS NULL);

-- Note: Existing policies already restrict users to their own rows and grant admins full access.
-- This policy is an explicit safeguard for rows with NULL user_id to satisfy security scanners.
