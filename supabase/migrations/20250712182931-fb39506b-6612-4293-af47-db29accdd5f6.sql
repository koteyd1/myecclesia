-- Add foreign key constraint between event_registrations and events tables
ALTER TABLE public.event_registrations 
ADD CONSTRAINT event_registrations_event_id_fkey 
FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

-- Create unique constraint to prevent duplicate registrations (if not exists)
ALTER TABLE public.event_registrations 
ADD CONSTRAINT event_registrations_user_id_event_id_key 
UNIQUE (user_id, event_id);