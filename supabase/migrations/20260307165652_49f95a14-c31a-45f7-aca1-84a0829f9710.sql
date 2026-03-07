
-- Platform settings table for configurable admin controls
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage platform settings
CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone can read platform settings (needed by edge functions via service role, and frontend for PayPal toggle)
CREATE POLICY "Anyone can read platform settings"
  ON public.platform_settings FOR SELECT
  USING (true);

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description) VALUES
  ('platform_fee_percent', '0'::jsonb, 'Platform fee percentage deducted from each transaction'),
  ('paypal_enabled', 'true'::jsonb, 'Whether PayPal is available as a payment method for organisers'),
  ('apple_google_pay_enabled', 'true'::jsonb, 'Whether Apple Pay and Google Pay are enabled via Stripe Checkout');

-- Add payouts_paused flag to stripe_connected_accounts
ALTER TABLE public.stripe_connected_accounts
  ADD COLUMN IF NOT EXISTS payouts_paused boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payouts_paused_reason text,
  ADD COLUMN IF NOT EXISTS payouts_paused_at timestamp with time zone;

-- Trigger for updated_at on platform_settings
CREATE TRIGGER update_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
