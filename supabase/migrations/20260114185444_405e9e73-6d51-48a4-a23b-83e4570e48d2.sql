-- Create ticket_types table for multiple ticket types per event
CREATE TABLE public.ticket_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  quantity_available INTEGER NOT NULL DEFAULT 100,
  quantity_sold INTEGER NOT NULL DEFAULT 0,
  max_per_order INTEGER DEFAULT 10,
  sale_start_date TIMESTAMP WITH TIME ZONE,
  sale_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on ticket_types
ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

-- Anyone can view active ticket types for events
CREATE POLICY "Anyone can view active ticket types"
ON public.ticket_types
FOR SELECT
USING (is_active = true);

-- Event creators can manage their ticket types
CREATE POLICY "Event creators can manage ticket types"
ON public.ticket_types
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = ticket_types.event_id
    AND e.created_by = auth.uid()
  )
);

-- Admins can manage all ticket types
CREATE POLICY "Admins can manage all ticket types"
ON public.ticket_types
FOR ALL
USING (is_admin_user());

-- Add new columns to tickets table
ALTER TABLE public.tickets 
ADD COLUMN IF NOT EXISTS ticket_type_id UUID REFERENCES public.ticket_types(id),
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS check_in_status TEXT DEFAULT 'not_checked_in',
ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS checked_in_by UUID;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_check_in_status ON public.tickets(check_in_status);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON public.ticket_types(event_id);

-- Add policy for event creators to view and check-in tickets for their events
CREATE POLICY "Event creators can view tickets for their events"
ON public.tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tickets.event_id
    AND e.created_by = auth.uid()
  )
);

-- Event creators can update check-in status for their event tickets
CREATE POLICY "Event creators can check-in tickets"
ON public.tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tickets.event_id
    AND e.created_by = auth.uid()
  )
);

-- Admins can view and manage all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.tickets
FOR ALL
USING (is_admin_user());

-- Create trigger to update updated_at for ticket_types
CREATE TRIGGER update_ticket_types_updated_at
BEFORE UPDATE ON public.ticket_types
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update ticket type quantity sold
CREATE OR REPLACE FUNCTION public.update_ticket_type_quantity_sold()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.ticket_type_id IS NOT NULL THEN
    UPDATE public.ticket_types 
    SET quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.ticket_type_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'confirmed' AND NEW.status = 'confirmed' AND NEW.ticket_type_id IS NOT NULL THEN
    UPDATE public.ticket_types 
    SET quantity_sold = quantity_sold + NEW.quantity
    WHERE id = NEW.ticket_type_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'confirmed' AND NEW.status != 'confirmed' AND OLD.ticket_type_id IS NOT NULL THEN
    UPDATE public.ticket_types 
    SET quantity_sold = GREATEST(0, quantity_sold - OLD.quantity)
    WHERE id = OLD.ticket_type_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_ticket_quantity_on_sale
AFTER INSERT OR UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_ticket_type_quantity_sold();