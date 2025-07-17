-- Update existing events with sample ticket URLs
UPDATE public.events 
SET ticket_url = CASE 
  WHEN category = 'Worship' THEN 'https://eventbrite.com/worship-service-tickets'
  WHEN category = 'Youth' THEN 'https://eventbrite.com/youth-group-tickets'
  WHEN category = 'Community' THEN 'https://eventbrite.com/community-dinner-tickets'
  WHEN category = 'Education' THEN 'https://eventbrite.com/bible-study-tickets'
  WHEN category = 'Special Event' THEN 'https://eventbrite.com/easter-celebration-tickets'
  WHEN category = 'Retreat' THEN 'https://eventbrite.com/marriage-retreat-tickets'
  ELSE 'https://eventbrite.com/church-event-tickets'
END;