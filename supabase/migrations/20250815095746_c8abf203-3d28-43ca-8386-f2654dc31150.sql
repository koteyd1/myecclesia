-- Fix overly permissive donation policy
-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "service_role_insert_anonymous_donations" ON public.donations;

-- Create a more restrictive policy that only allows edge functions to insert anonymous donations
-- This policy checks for a specific header that edge functions can set
CREATE POLICY "edge_functions_insert_anonymous_donations" 
ON public.donations 
FOR INSERT 
WITH CHECK (
  -- Allow if user is authenticated and inserting their own donation
  (auth.uid() = user_id AND user_id IS NOT NULL)
  OR
  -- Allow anonymous donations only from edge functions (service role)
  (user_id IS NULL AND auth.role() = 'service_role')
);

-- Add additional validation trigger for anonymous donations
CREATE OR REPLACE FUNCTION public.validate_anonymous_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- For anonymous donations, ensure required fields are present
  IF NEW.user_id IS NULL THEN
    IF NEW.email IS NULL OR NEW.email = '' THEN
      RAISE EXCEPTION 'Email is required for anonymous donations';
    END IF;
    
    IF NEW.amount IS NULL OR NEW.amount <= 0 THEN
      RAISE EXCEPTION 'Valid amount is required for donations';
    END IF;
    
    IF NEW.donation_type IS NULL OR NEW.donation_type = '' THEN
      RAISE EXCEPTION 'Donation type is required';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for anonymous donation validation
DROP TRIGGER IF EXISTS validate_anonymous_donation_trigger ON public.donations;
CREATE TRIGGER validate_anonymous_donation_trigger
  BEFORE INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_anonymous_donation();