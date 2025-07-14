-- Update existing events with sample denominations
UPDATE public.events 
SET denominations = 'All Welcome' 
WHERE title = 'Sunday Worship Service';

UPDATE public.events 
SET denominations = 'Baptist' 
WHERE title = 'Youth Group Meeting';

UPDATE public.events 
SET denominations = 'Interfaith' 
WHERE title = 'Community Outreach Dinner';

UPDATE public.events 
SET denominations = 'Methodist' 
WHERE title = 'Bible Study Workshop';

UPDATE public.events 
SET denominations = 'All Welcome' 
WHERE title = 'Easter Celebration Service';