-- Update one of the cancelled registrations back to registered status
UPDATE public.event_registrations 
SET status = 'registered', updated_at = now()
WHERE id = (SELECT id FROM event_registrations WHERE status = 'cancelled' LIMIT 1);