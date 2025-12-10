
-- Update events with categories and denominations based on content
UPDATE public.events SET 
  category = CASE 
    WHEN title ILIKE '%carol%' THEN 'Music & Worship'
    WHEN title ILIKE '%concert%' THEN 'Music & Worship'
    WHEN title ILIKE '%jazz%' THEN 'Music & Worship'
    WHEN title ILIKE '%party%' THEN 'Social & Fellowship'
    WHEN title ILIKE '%revival%' THEN 'Conference & Revival'
    WHEN title ILIKE '%encontro%' THEN 'Retreat'
    WHEN title ILIKE '%prayer%' THEN 'Prayer & Worship'
    WHEN title ILIKE '%worship%' THEN 'Prayer & Worship'
    WHEN title ILIKE '%youth%' THEN 'Youth & Family'
    WHEN title ILIKE '%bible%' THEN 'Education & Study'
    WHEN title ILIKE '%christmas%' THEN 'Christmas Event'
    ELSE 'Community Event'
  END,
  denominations = CASE
    WHEN organizer ILIKE '%church trust%' OR organizer ILIKE '%cathedral%' THEN 'Anglican'
    WHEN organizer ILIKE '%lgb christian%' THEN 'Ecumenical'
    WHEN organizer ILIKE '%vine church%' OR title ILIKE '%encontro%' THEN 'Evangelical'
    WHEN organizer ILIKE '%wildfire%' OR title ILIKE '%revival%' THEN 'Charismatic'
    WHEN organizer ILIKE '%catholic%' THEN 'Catholic'
    WHEN organizer ILIKE '%baptist%' THEN 'Baptist'
    WHEN organizer ILIKE '%methodist%' THEN 'Methodist'
    WHEN organizer ILIKE '%pentecostal%' THEN 'Pentecostal'
    ELSE 'Non-denominational'
  END
WHERE category IS NULL OR denominations IS NULL;
