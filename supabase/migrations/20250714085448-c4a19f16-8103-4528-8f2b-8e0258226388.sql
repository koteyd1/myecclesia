-- Add denominations field to events table
ALTER TABLE public.events 
ADD COLUMN denominations text;