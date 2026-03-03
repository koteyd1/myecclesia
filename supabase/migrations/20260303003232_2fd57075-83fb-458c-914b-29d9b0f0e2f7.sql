
-- Allow event creators to view registrations for their events
CREATE POLICY "Event creators can view registrations for their events"
ON public.event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM events e
    WHERE e.id = event_registrations.event_id
    AND e.created_by = auth.uid()
  )
);

-- Allow event creators to view profiles of their attendees
CREATE POLICY "Event creators can view attendee profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM event_registrations er
    JOIN events e ON e.id = er.event_id
    WHERE er.user_id = profiles.user_id
    AND e.created_by = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM tickets t
    JOIN events e ON e.id = t.event_id
    WHERE t.user_id = profiles.user_id
    AND e.created_by = auth.uid()
  )
);
