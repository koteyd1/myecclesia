-- Fix security linter warnings

-- 1. Fix function search path mutable issue for existing functions
-- Update functions to have proper search_path set

-- Fix get_donation_admin_view function
CREATE OR REPLACE FUNCTION public.get_donation_admin_view()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  amount integer,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  currency text,
  donation_type text,
  email text,
  full_name text,
  phone text,
  message text,
  stripe_customer_id text,
  stripe_session_id text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  -- Only return data if user is admin
  SELECT 
    d.id, d.user_id, d.amount, d.created_at, d.updated_at,
    d.status, d.currency, d.donation_type,
    d.email, d.full_name, d.phone, d.message,
    d.stripe_customer_id, d.stripe_session_id
  FROM public.donations d
  WHERE is_admin_user();
$$;

-- Fix get_user_donations function
CREATE OR REPLACE FUNCTION public.get_user_donations()
RETURNS TABLE (
  id uuid,
  amount integer,
  created_at timestamptz,
  updated_at timestamptz,
  status text,
  currency text,
  donation_type text,
  message text,
  masked_email text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    d.id, d.amount, d.created_at, d.updated_at,
    d.status, d.currency, d.donation_type, d.message,
    -- Mask email for privacy
    CASE 
      WHEN d.email IS NOT NULL THEN 
        substring(d.email from 1 for 2) || '***' || substring(d.email from '@.*')
      ELSE NULL
    END as masked_email
  FROM public.donations d
  WHERE d.user_id = auth.uid() AND d.user_id IS NOT NULL;
$$;

-- Fix mask_stripe_data function
CREATE OR REPLACE FUNCTION public.mask_stripe_data(stripe_id text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT CASE 
    WHEN is_admin_user() THEN stripe_id
    WHEN stripe_id IS NOT NULL THEN 
      substring(stripe_id from 1 for 4) || '***' || substring(stripe_id from length(stripe_id) - 3)
    ELSE NULL
  END;
$$;

-- Fix validate_anonymous_donation_security function
CREATE OR REPLACE FUNCTION public.validate_anonymous_donation_security()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- For anonymous donations, validate required security measures
  IF NEW.user_id IS NULL THEN
    -- Ensure we have minimal required data
    IF NEW.email IS NULL OR NEW.email = '' THEN
      RAISE EXCEPTION 'Email is required for anonymous donations';
    END IF;
    
    -- Validate email format more strictly for anonymous donations
    IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      RAISE EXCEPTION 'Valid email format is required for anonymous donations';
    END IF;
    
    -- Ensure donation type is specified
    IF NEW.donation_type IS NULL OR NEW.donation_type = '' THEN
      RAISE EXCEPTION 'Donation type is required for anonymous donations';
    END IF;
    
    -- Log anonymous donation creation for security monitoring
    INSERT INTO public.admin_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      new_values
    ) VALUES (
      auth.uid(),
      'CREATE_ANONYMOUS_DONATION',
      'donations',
      NEW.id,
      jsonb_build_object(
        'amount', NEW.amount,
        'donation_type', NEW.donation_type,
        'has_email', CASE WHEN NEW.email IS NOT NULL THEN true ELSE false END,
        'has_phone', CASE WHEN NEW.phone IS NOT NULL THEN true ELSE false END,
        'created_by_role', auth.role()
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Fix audit_sensitive_donation_changes function
CREATE OR REPLACE FUNCTION public.audit_sensitive_donation_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Log access to donations with sensitive PII, especially anonymous ones
  IF (OLD.user_id IS NULL OR (NEW IS NOT NULL AND NEW.user_id IS NULL)) OR 
     (OLD.email IS NOT NULL OR (NEW IS NOT NULL AND NEW.email IS NOT NULL)) OR
     (OLD.stripe_customer_id IS NOT NULL OR (NEW IS NOT NULL AND NEW.stripe_customer_id IS NOT NULL)) THEN
    
    INSERT INTO public.admin_audit_log (
      user_id,
      action,
      table_name,
      record_id,
      old_values,
      new_values
    ) VALUES (
      auth.uid(),
      CASE 
        WHEN (OLD.user_id IS NULL OR (NEW IS NOT NULL AND NEW.user_id IS NULL)) THEN 
          CONCAT(TG_OP, '_ANONYMOUS_DONATION_PII')
        ELSE 
          CONCAT(TG_OP, '_SENSITIVE_DONATION_DATA')
      END,
      'donations',
      COALESCE(CASE WHEN NEW IS NOT NULL THEN NEW.id ELSE NULL END, OLD.id),
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN 
        jsonb_build_object(
          'id', OLD.id,
          'user_id', OLD.user_id,
          'email_accessed', CASE WHEN OLD.email IS NOT NULL THEN true ELSE false END,
          'pii_accessed', CASE WHEN OLD.full_name IS NOT NULL OR OLD.phone IS NOT NULL THEN true ELSE false END,
          'payment_data_accessed', CASE WHEN OLD.stripe_customer_id IS NOT NULL THEN true ELSE false END
        )
      ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') AND NEW IS NOT NULL THEN 
        jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'email_accessed', CASE WHEN NEW.email IS NOT NULL THEN true ELSE false END,
          'pii_accessed', CASE WHEN NEW.full_name IS NOT NULL OR NEW.phone IS NOT NULL THEN true ELSE false END,
          'payment_data_accessed', CASE WHEN NEW.stripe_customer_id IS NOT NULL THEN true ELSE false END
        )
      ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;