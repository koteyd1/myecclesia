-- Tighten RLS policies and add validation triggers for donations

-- 1) Drop overly-permissive policies
DROP POLICY IF EXISTS "Anyone can insert donations" ON public.donations;
DROP POLICY IF EXISTS "System can update donations" ON public.donations;

-- 2) Restrict inserts to authenticated users inserting their own records
CREATE POLICY "Authenticated users can insert their own donations"
ON public.donations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3) Restrict updates to authenticated users updating their own records
CREATE POLICY "Users can update their own donations"
ON public.donations
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4) Ensure robust input validation using triggers
--    Attach existing validation function to donations table for INSERT/UPDATE
DROP TRIGGER IF EXISTS validate_donations_before_write ON public.donations;
CREATE TRIGGER validate_donations_before_write
BEFORE INSERT OR UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.validate_donation_input();

-- 5) Keep updated_at accurate on changes
DROP TRIGGER IF EXISTS update_donations_updated_at ON public.donations;
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();