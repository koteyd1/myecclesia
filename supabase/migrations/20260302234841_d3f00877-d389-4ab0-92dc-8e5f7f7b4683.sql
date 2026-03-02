-- Add PayPal email column to stripe_connected_accounts
ALTER TABLE public.stripe_connected_accounts 
ADD COLUMN paypal_email text;

-- Add a comment for clarity
COMMENT ON COLUMN public.stripe_connected_accounts.paypal_email IS 'Organiser PayPal email for receiving ticket payments';
