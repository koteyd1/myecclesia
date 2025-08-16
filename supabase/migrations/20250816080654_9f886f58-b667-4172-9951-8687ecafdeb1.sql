-- Fix security issues with profiles, donations, contact_messages, and admin_audit_log tables
-- Ensure all sensitive tables are properly protected with comprehensive RLS policies

-- 1. First, let's add missing authentication checks to profiles table
-- Drop existing policies and recreate them with stronger security
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;

-- Create new comprehensive policies for profiles table
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT TO authenticated
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "profiles_insert_own_authenticated" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL);

CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
FOR UPDATE TO authenticated
USING (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  auth.uid() = user_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "profiles_delete_admin_only" ON public.profiles
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Fix donations table - ensure no public access
-- Drop existing policies that might allow public access
DROP POLICY IF EXISTS "authenticated_users_insert_own_donations" ON public.donations;
DROP POLICY IF EXISTS "edge_functions_insert_anonymous_donations" ON public.donations;

-- Recreate donations policies with stricter controls
CREATE POLICY "donations_insert_authenticated_or_service" ON public.donations
FOR INSERT 
TO authenticated, service_role
WITH CHECK (
  -- Authenticated users can insert their own donations
  (auth.uid() = user_id AND user_id IS NOT NULL) OR
  -- Service role can insert anonymous donations (for edge functions)
  (auth.role() = 'service_role' AND user_id IS NULL)
);

-- 3. Fix contact_messages table - ensure admin-only access for reading
-- Drop existing policies and recreate with admin-only read access
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Only admins can view contact messages" ON public.contact_messages;

CREATE POLICY "contact_messages_insert_public" ON public.contact_messages
FOR INSERT 
TO anon, authenticated, service_role
WITH CHECK (true);

CREATE POLICY "contact_messages_select_admin_only" ON public.contact_messages
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "contact_messages_update_admin_only" ON public.contact_messages
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "contact_messages_delete_admin_only" ON public.contact_messages
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 4. Ensure admin_audit_log is completely secure
-- Drop and recreate policy to ensure only admins can access
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_audit_log;

CREATE POLICY "admin_audit_log_admin_only" ON public.admin_audit_log
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Add explicit deny policies for anon users on sensitive tables
-- This ensures no anonymous access is possible
CREATE POLICY "profiles_deny_anon" ON public.profiles
FOR ALL TO anon
USING (false);

CREATE POLICY "donations_deny_anon_select" ON public.donations
FOR SELECT TO anon
USING (false);

CREATE POLICY "admin_audit_log_deny_anon" ON public.admin_audit_log
FOR ALL TO anon
USING (false);

-- 6. Create a security function to double-check user authentication
CREATE OR REPLACE FUNCTION public.is_authenticated_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT auth.uid() IS NOT NULL AND auth.role() = 'authenticated';
$$;