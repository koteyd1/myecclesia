-- Create donations table to track payment information
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  amount INTEGER NOT NULL, -- Amount in cents
  currency TEXT DEFAULT 'usd',
  donation_type TEXT NOT NULL CHECK (donation_type IN ('one_time', 'recurring')),
  stripe_customer_id TEXT,
  stripe_session_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own donations" 
ON public.donations 
FOR SELECT 
USING (auth.uid() = user_id OR auth.email() = email);

CREATE POLICY "Anyone can insert donations" 
ON public.donations 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update donations" 
ON public.donations 
FOR UPDATE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();