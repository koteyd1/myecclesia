-- Create user_calendar table to track which events users have added to their personal calendar
CREATE TABLE public.user_calendar (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_calendar ENABLE ROW LEVEL SECURITY;

-- Create policies for user calendar
CREATE POLICY "Users can view their own calendar events" 
ON public.user_calendar 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can add events to their calendar" 
ON public.user_calendar 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove events from their calendar" 
ON public.user_calendar 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all calendar events" 
ON public.user_calendar 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage all calendar events" 
ON public.user_calendar 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_calendar_updated_at
BEFORE UPDATE ON public.user_calendar
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();