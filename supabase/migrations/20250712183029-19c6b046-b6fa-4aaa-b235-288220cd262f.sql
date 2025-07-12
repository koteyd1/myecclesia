-- Update cancelled registrations back to registered status
-- This will make them visible on the dashboard again
UPDATE public.event_registrations 
SET status = 'registered' 
WHERE status = 'cancelled';