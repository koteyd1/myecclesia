
-- Guest RSVPs table for unauthenticated users
CREATE TABLE public.guest_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'registered',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.guest_rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (guest RSVP)
CREATE POLICY "Anyone can create guest RSVP"
  ON public.guest_rsvps
  FOR INSERT
  WITH CHECK (true);

-- Event creators can view guest RSVPs for their events
CREATE POLICY "Event creators can view guest RSVPs"
  ON public.guest_rsvps
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = guest_rsvps.event_id
      AND e.created_by = auth.uid()
    )
  );

-- Admins can view all guest RSVPs
CREATE POLICY "Admins can view all guest RSVPs"
  ON public.guest_rsvps
  FOR SELECT
  USING (is_admin_user());

-- Admins can manage all guest RSVPs
CREATE POLICY "Admins can manage guest RSVPs"
  ON public.guest_rsvps
  FOR ALL
  USING (is_admin_user())
  WITH CHECK (is_admin_user());

-- Add unique constraint to prevent duplicate guest RSVPs
CREATE UNIQUE INDEX guest_rsvps_event_email_unique 
  ON public.guest_rsvps (event_id, email) 
  WHERE status = 'registered';

-- Add updated_at trigger
CREATE TRIGGER update_guest_rsvps_updated_at
  BEFORE UPDATE ON public.guest_rsvps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
