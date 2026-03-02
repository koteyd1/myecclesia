
-- Drop all existing policies on messages
DROP POLICY IF EXISTS "Admins can manage all messages" ON public.messages;
DROP POLICY IF EXISTS "Recipients can update messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete sent messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view their own messages" ON public.messages;

-- Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage all messages"
ON public.messages FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT TO authenticated
USING ((auth.uid() = sender_id) OR (auth.uid() = recipient_id));

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT TO authenticated
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update messages"
ON public.messages FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete sent messages"
ON public.messages FOR DELETE TO authenticated
USING (auth.uid() = sender_id);
