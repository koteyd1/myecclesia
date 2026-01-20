-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications table
-- Only admins/system can manage notifications (typically used for internal system notifications)
CREATE POLICY "Only service role can manage notifications"
ON public.notifications
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Users can view notifications related to their tickets
CREATE POLICY "Users can view their ticket notifications"
ON public.notifications
FOR SELECT
USING (
  ticket_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.tickets t 
    WHERE t.id = notifications.ticket_id 
    AND t.user_id = auth.uid()
  )
);

-- Admins can view all notifications
CREATE POLICY "Admins can view all notifications"
ON public.notifications
FOR SELECT
USING (is_admin_user());