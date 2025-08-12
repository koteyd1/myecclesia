-- Ensure RLS is enabled on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Restrict read access to admins only (idempotent creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'contact_messages' 
      AND policyname = 'Only admins can view contact messages'
  ) THEN
    CREATE POLICY "Only admins can view contact messages"
    ON public.contact_messages
    FOR SELECT
    USING (is_admin_user());
  END IF;
END$$;
