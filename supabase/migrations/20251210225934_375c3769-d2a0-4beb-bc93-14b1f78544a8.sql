
-- Update events with homepage categories
UPDATE public.events SET 
  category = CASE 
    WHEN title ILIKE '%conference%' OR title ILIKE '%summit%' OR title ILIKE '%revival%' THEN 'Conference'
    WHEN title ILIKE '%worship%' OR title ILIKE '%music%' OR title ILIKE '%carol%' OR title ILIKE '%concert%' OR title ILIKE '%jazz%' OR title ILIKE '%choir%' THEN 'Worship and Music'
    WHEN title ILIKE '%service%' OR title ILIKE '%communion%' OR title ILIKE '%mass%' OR title ILIKE '%sunday%' THEN 'Church Service'
    WHEN title ILIKE '%bible%' OR title ILIKE '%study%' OR title ILIKE '%scripture%' THEN 'Bible Study'
    WHEN title ILIKE '%youth%' OR title ILIKE '%teen%' OR title ILIKE '%young%' OR title ILIKE '%children%' OR title ILIKE '%kids%' THEN 'Youth Events'
    WHEN title ILIKE '%outreach%' OR title ILIKE '%community%' OR title ILIKE '%volunteer%' OR title ILIKE '%charity%' THEN 'Community Outreach'
    WHEN title ILIKE '%camp%' OR title ILIKE '%retreat%' OR title ILIKE '%encontro%' THEN 'Camps and Retreats'
    WHEN title ILIKE '%course%' OR title ILIKE '%seminar%' OR title ILIKE '%training%' OR title ILIKE '%workshop%' OR title ILIKE '%theology%' OR title ILIKE '%apologetics%' THEN 'Educational'
    WHEN title ILIKE '%christmas%' OR title ILIKE '%easter%' OR title ILIKE '%party%' OR title ILIKE '%celebration%' OR title ILIKE '%gala%' OR title ILIKE '%anniversary%' THEN 'Special Events'
    WHEN title ILIKE '%mission%' OR title ILIKE '%evangel%' OR title ILIKE '%global%' THEN 'Missions'
    ELSE 'Special Events'
  END;
