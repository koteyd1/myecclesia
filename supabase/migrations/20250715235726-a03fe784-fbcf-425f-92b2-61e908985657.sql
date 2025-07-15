-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can view all contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;

-- Create simple policies that don't depend on app_role for basic functionality
CREATE POLICY "Anyone can insert contact messages" 
ON public.contact_messages 
FOR INSERT 
WITH CHECK (true);

-- Admin policies that will work once the user system is fully set up
-- For now, just allow the basic insert operation