-- Add registration_type column to events table
-- Values: 'ticketed' (default, existing behaviour), 'rsvp', 'external_ticket', 'external_page'
ALTER TABLE public.events
ADD COLUMN registration_type text NOT NULL DEFAULT 'ticketed';

-- Backfill existing events based on current data
UPDATE public.events
SET registration_type = CASE
  WHEN ticket_url IS NOT NULL AND ticket_url != '' THEN 'external_ticket'
  WHEN external_url IS NOT NULL AND external_url != '' THEN 'external_page'
  ELSE 'ticketed'
END;