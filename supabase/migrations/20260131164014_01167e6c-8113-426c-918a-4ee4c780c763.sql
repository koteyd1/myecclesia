-- Add is_verified column to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- Drop existing select policy
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;

-- Create new policies for event visibility
-- Anyone can view verified events
CREATE POLICY "Anyone can view verified events" 
ON public.events 
FOR SELECT 
USING (is_verified = true);

-- Users can view their own events (even unverified)
CREATE POLICY "Users can view their own events" 
ON public.events 
FOR SELECT 
USING (auth.uid() = created_by);

-- Admins can view all events
CREATE POLICY "Admins can view all events" 
ON public.events 
FOR SELECT 
USING (is_admin_user());