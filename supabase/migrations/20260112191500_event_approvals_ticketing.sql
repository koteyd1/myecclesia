-- Event approvals + ticketing system

-- 1) Event approval workflow
DO $$
BEGIN
  CREATE TYPE public.event_approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS approval_status public.event_approval_status NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS rejected_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Backfill safety (older rows / environments)
UPDATE public.events
SET approval_status = 'approved'
WHERE approval_status IS NULL;

-- Restrict visibility: public sees only approved; admins + creators can see everything
DROP POLICY IF EXISTS "Anyone can view events" ON public.events;
DROP POLICY IF EXISTS "Public can view approved events" ON public.events;
CREATE POLICY "Public can view approved events"
ON public.events
FOR SELECT
USING (
  approval_status = 'approved'
  OR public.is_admin_user()
  OR created_by = auth.uid()
);

-- Ensure organizers (verified org/minister) can create events too
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
CREATE POLICY "Organizers can create events"
ON public.events
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_admin_user()
    OR (
      organization_id IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.organizations o
        WHERE o.id = organization_id
          AND o.user_id = auth.uid()
          AND o.is_verified = true
      )
    )
    OR (
      minister_id IS NOT NULL AND EXISTS (
        SELECT 1
        FROM public.ministers m
        WHERE m.id = minister_id
          AND m.user_id = auth.uid()
          AND m.is_verified = true
      )
    )
  )
);

DROP POLICY IF EXISTS "Organizers can update events" ON public.events;
CREATE POLICY "Organizers can update events"
ON public.events
FOR UPDATE
USING (public.is_admin_user() OR created_by = auth.uid())
WITH CHECK (public.is_admin_user() OR created_by = auth.uid());

DROP POLICY IF EXISTS "Organizers can delete events" ON public.events;
CREATE POLICY "Organizers can delete events"
ON public.events
FOR DELETE
USING (public.is_admin_user() OR created_by = auth.uid());

-- Default approval status:
-- - Admin-created events auto-approve
-- - Minister/organization-created events default to pending
CREATE OR REPLACE FUNCTION public.set_event_approval_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default to approved unless overridden below
  IF NEW.approval_status IS NULL THEN
    NEW.approval_status := 'approved';
  END IF;

  IF (NEW.organization_id IS NOT NULL OR NEW.minister_id IS NOT NULL) AND NOT public.is_admin_user() THEN
    NEW.approval_status := 'pending';
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
    NEW.rejected_at := NULL;
    NEW.rejected_by := NULL;
    NEW.rejection_reason := NULL;
  ELSIF public.is_admin_user() AND NEW.approval_status = 'approved' AND NEW.approved_at IS NULL THEN
    NEW.approved_at := now();
    NEW.approved_by := auth.uid();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_event_approval_defaults ON public.events;
CREATE TRIGGER trg_set_event_approval_defaults
BEFORE INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_event_approval_defaults();

-- Prevent non-admins from changing approval fields (even if they can edit their event)
CREATE OR REPLACE FUNCTION public.prevent_non_admin_event_approval_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_admin_user() THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_status IS DISTINCT FROM OLD.approval_status
     OR NEW.approved_at IS DISTINCT FROM OLD.approved_at
     OR NEW.approved_by IS DISTINCT FROM OLD.approved_by
     OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at
     OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
  THEN
    RAISE EXCEPTION 'Only admins can change event approval fields';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_non_admin_event_approval_changes ON public.events;
CREATE TRIGGER trg_prevent_non_admin_event_approval_changes
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.prevent_non_admin_event_approval_changes();

-- 2) Ticketing system
CREATE TABLE IF NOT EXISTS public.event_ticket_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  amount_pence INTEGER,
  currency TEXT NOT NULL DEFAULT 'gbp',
  stripe_session_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.event_ticket_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own ticket orders" ON public.event_ticket_orders;
CREATE POLICY "Users can view their own ticket orders"
ON public.event_ticket_orders
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own ticket orders" ON public.event_ticket_orders;
CREATE POLICY "Users can create their own ticket orders"
ON public.event_ticket_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all ticket orders" ON public.event_ticket_orders;
CREATE POLICY "Admins can view all ticket orders"
ON public.event_ticket_orders
FOR SELECT
USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage all ticket orders" ON public.event_ticket_orders;
CREATE POLICY "Admins can manage all ticket orders"
ON public.event_ticket_orders
FOR ALL
USING (public.is_admin_user());

DROP TRIGGER IF EXISTS update_event_ticket_orders_updated_at ON public.event_ticket_orders;
CREATE TRIGGER update_event_ticket_orders_updated_at
BEFORE UPDATE ON public.event_ticket_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Extend registrations to support ticket quantity + payment tracking
ALTER TABLE public.event_registrations
  ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'free' CHECK (payment_status IN ('free', 'pending', 'paid', 'refunded')),
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

