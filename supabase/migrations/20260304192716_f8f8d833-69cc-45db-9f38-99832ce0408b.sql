
CREATE OR REPLACE FUNCTION public.notify_event_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id uuid;
  event_slug text;
BEGIN
  -- Only fire when is_verified changes from false to true
  IF OLD.is_verified = false AND NEW.is_verified = true AND NEW.created_by IS NOT NULL THEN
    -- Get an admin user to send the message from
    SELECT user_id INTO admin_id
    FROM public.user_roles
    WHERE role = 'admin'
    LIMIT 1;

    IF admin_id IS NOT NULL THEN
      INSERT INTO public.messages (
        sender_id,
        recipient_id,
        subject,
        content,
        is_admin_broadcast,
        is_read
      ) VALUES (
        admin_id,
        NEW.created_by,
        'Your event has been approved! ✅',
        'Great news! Your event **' || NEW.title || '** has been reviewed and approved by our team.' || E'\n\n' ||
        'It is now live and visible to all visitors on MyEcclesia. You can view your event here: [View Event](/events/' || NEW.slug || ')' || E'\n\n' ||
        'If you need to make any changes, you can edit your event from your [My Profiles](/my-profiles) page.' || E'\n\n' ||
        'Thank you for contributing to the MyEcclesia community! 🙏' || E'\n\n' ||
        '— The MyEcclesia Team',
        true,
        false
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger on the events table
DROP TRIGGER IF EXISTS on_event_approved ON public.events;
CREATE TRIGGER on_event_approved
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_approved();
