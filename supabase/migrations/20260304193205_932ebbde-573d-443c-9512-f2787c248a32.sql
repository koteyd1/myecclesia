
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS accept_donations boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS accept_gift_aid boolean NOT NULL DEFAULT false;
