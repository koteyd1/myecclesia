-- Create event registrations table to track which users are attending which events
CREATE TABLE public.event_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable Row Level Security
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for event registrations
CREATE POLICY "Users can view their own registrations" 
ON public.event_registrations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can register for events" 
ON public.event_registrations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel their own registrations" 
ON public.event_registrations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all registrations" 
ON public.event_registrations 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all registrations" 
ON public.event_registrations 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_registrations_updated_at
BEFORE UPDATE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();