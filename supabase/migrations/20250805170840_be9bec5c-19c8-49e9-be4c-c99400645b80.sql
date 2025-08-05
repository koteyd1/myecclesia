-- Add RLS policy to allow admins to delete user profiles
CREATE POLICY "Admins can delete profiles" ON public.profiles
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));