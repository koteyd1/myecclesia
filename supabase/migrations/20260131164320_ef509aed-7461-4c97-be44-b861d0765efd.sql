-- Verify all existing events on the platform
UPDATE public.events SET is_verified = true WHERE is_verified = false OR is_verified IS NULL;