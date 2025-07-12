-- Add external URL field to events table
ALTER TABLE public.events 
ADD COLUMN external_url TEXT;