-- Add is_featured column to events table for admin-promoted events
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Create index for faster featured events queries
CREATE INDEX IF NOT EXISTS idx_events_is_featured ON public.events(is_featured) WHERE is_featured = true;