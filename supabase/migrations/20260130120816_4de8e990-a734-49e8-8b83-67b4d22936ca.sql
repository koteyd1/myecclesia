-- Drop and recreate the INSERT policy for ministers with explicit authenticated target
DROP POLICY IF EXISTS "Users can create their own minister profile" ON public.ministers;

CREATE POLICY "Users can create their own minister profile"
ON public.ministers
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Also ensure users can view their own unverified minister profiles
DROP POLICY IF EXISTS "Users can view their own minister profiles" ON public.ministers;
CREATE POLICY "Users can view their own minister profiles"
ON public.ministers
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);