-- Temporarily disable the problematic RLS policies and create simpler ones
-- that work without the app_role enum type

-- Drop all existing admin-related policies
DROP POLICY IF EXISTS "Admins can insert events" ON public.events;
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
DROP POLICY IF EXISTS "Admins can create blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can view all blog posts" ON public.blog_posts;

-- Create a simple function that checks admin role using text comparison
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role::text = 'admin'
  )
$$;

-- Create simpler RLS policies for events
CREATE POLICY "Admins can insert events" 
ON public.events 
FOR INSERT 
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update events" 
ON public.events 
FOR UPDATE 
USING (public.is_admin_user());

CREATE POLICY "Admins can delete events" 
ON public.events 
FOR DELETE 
USING (public.is_admin_user());

-- Create simpler RLS policies for blog posts
CREATE POLICY "Admins can create blog posts" 
ON public.blog_posts 
FOR INSERT 
WITH CHECK (public.is_admin_user());

CREATE POLICY "Admins can update blog posts" 
ON public.blog_posts 
FOR UPDATE 
USING (public.is_admin_user());

CREATE POLICY "Admins can delete blog posts" 
ON public.blog_posts 
FOR DELETE 
USING (public.is_admin_user());

CREATE POLICY "Admins can view all blog posts" 
ON public.blog_posts 
FOR SELECT 
USING (public.is_admin_user());