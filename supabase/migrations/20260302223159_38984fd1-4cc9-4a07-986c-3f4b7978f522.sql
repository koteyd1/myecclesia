
-- Create a function to send a welcome message to new users
CREATE OR REPLACE FUNCTION public.send_welcome_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id uuid;
BEGIN
  -- Get the first admin user to send from
  SELECT user_id INTO admin_id
  FROM public.user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Only send if we have an admin sender
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
      NEW.user_id,
      'Welcome to MyEcclesia! 🎉',
      E'Hello and welcome to **MyEcclesia** — we''re so glad you''re here!\n\nMyEcclesia is your home for discovering and connecting with the Christian community across the UK. Here''s a quick guide to get you started:\n\n🔍 **Discover Events** — Browse upcoming worship services, conferences, youth events, and more on our [Events page](/events).\n\n⛪ **Find Churches** — Search for churches near you and follow your favourites to stay updated on their latest activities. Visit [Churches](/churches).\n\n👤 **Kingdom Leaders** — Connect with ministers and church leaders in your area. Explore [Kingdom Leaders](/ministers).\n\n🏢 **Organisations** — Discover Christian organisations making an impact. See [Organisations](/organizations).\n\n💼 **Opportunities** — Looking to serve? Find volunteer roles, jobs, and internships within the faith community at [Opportunities](/opportunities).\n\n📅 **Your Calendar** — Save events to your personal [Calendar](/calendar) so you never miss out.\n\n🎟️ **Tickets** — Book and manage your event tickets all in one place under [My Tickets](/my-tickets).\n\n📰 **Blog** — Read inspiring stories, devotionals, and community news on our [Blog](/blog).\n\nIf you have any questions, don''t hesitate to reach out via our [Help Centre](/help-centre) or [Contact page](/contact).\n\nWe pray that MyEcclesia blesses your walk of faith. Welcome to the family! 🙏\n\n— The MyEcclesia Team',
      true,
      false
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on profiles table (fires after new user profile is created)
CREATE TRIGGER send_welcome_message_trigger
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.send_welcome_message();
