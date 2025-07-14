-- Update existing events to use standardized categories
UPDATE events 
SET category = CASE 
    WHEN category = 'Worship' THEN 'Worship Service'
    WHEN category = 'Youth' THEN 'Youth Events'
    WHEN category = 'Community' THEN 'Community Outreach'
    WHEN category = 'Education' THEN 'Educational'
    WHEN category = 'Special Event' THEN 'Special Events'
    WHEN category = 'Retreat' THEN 'Retreats'
    ELSE category
END
WHERE category IN ('Worship', 'Youth', 'Community', 'Education', 'Special Event', 'Retreat');