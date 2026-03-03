-- Create enum for refund policy types
CREATE TYPE public.refund_policy AS ENUM ('flexible', 'moderate', 'strict', 'donation_based');

-- Add refund_policy column to events table
ALTER TABLE public.events
ADD COLUMN refund_policy public.refund_policy DEFAULT 'moderate';