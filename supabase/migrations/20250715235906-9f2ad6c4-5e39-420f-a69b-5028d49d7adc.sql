-- Drop the audit trigger that's causing the app_role error
DROP TRIGGER IF EXISTS audit_contact_messages_changes ON public.contact_messages;

-- Also drop the update trigger that might be causing issues
DROP TRIGGER IF EXISTS update_contact_messages_updated_at ON public.contact_messages;