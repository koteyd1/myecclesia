-- Create saved_events table for bookmarking events
CREATE TABLE public.saved_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- Enable RLS
ALTER TABLE public.saved_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own saved events
CREATE POLICY "Users can view their own saved events"
ON public.saved_events
FOR SELECT
USING (auth.uid() = user_id);

-- Users can save events
CREATE POLICY "Users can save events"
ON public.saved_events
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can unsave their own events
CREATE POLICY "Users can unsave their own events"
ON public.saved_events
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_saved_events_user_id ON public.saved_events(user_id);
CREATE INDEX idx_saved_events_event_id ON public.saved_events(event_id);