
-- Categorize events based on title keywords

-- Conference
UPDATE events SET category = 'Conference' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%conference%' OR 
  LOWER(title) LIKE '%summit%' OR 
  LOWER(title) LIKE '%symposium%' OR
  LOWER(title) LIKE '%forum%'
);

-- Worship and Music
UPDATE events SET category = 'Worship and Music' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%worship%' OR 
  LOWER(title) LIKE '%concert%' OR 
  LOWER(title) LIKE '%gala%' OR
  LOWER(title) LIKE '%choir%' OR
  LOWER(title) LIKE '%hymn%' OR
  LOWER(title) LIKE '%sing%' OR
  LOWER(title) LIKE '%music%' OR
  LOWER(title) LIKE '%praise%' OR
  LOWER(title) LIKE '%gospel%' OR
  LOWER(title) LIKE '%carol%'
);

-- Church Service
UPDATE events SET category = 'Church Service' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%service%' OR 
  LOWER(title) LIKE '%eucharist%' OR 
  LOWER(title) LIKE '%mass%' OR
  LOWER(title) LIKE '%sunday%' OR
  LOWER(title) LIKE '%communion%' OR
  LOWER(title) LIKE '%thanksgiving%' OR
  LOWER(title) LIKE '%evensong%' OR
  LOWER(title) LIKE '%vespers%' OR
  LOWER(title) LIKE '%matins%' OR
  LOWER(title) LIKE '%liturgy%'
);

-- Bible Study
UPDATE events SET category = 'Bible Study' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%bible%' OR 
  LOWER(title) LIKE '%scripture%' OR 
  LOWER(title) LIKE '%study%' OR
  LOWER(title) LIKE '%alpha course%' OR
  LOWER(title) LIKE '%alpha film%' OR
  LOWER(title) LIKE '%theology%' OR
  LOWER(title) LIKE '%lent%' OR
  LOWER(title) LIKE '%advent%'
);

-- Youth Events
UPDATE events SET category = 'Youth Events' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%youth%' OR 
  LOWER(title) LIKE '%young adult%' OR 
  LOWER(title) LIKE '%teen%' OR
  LOWER(title) LIKE '%children%' OR
  LOWER(title) LIKE '%kids%' OR
  LOWER(title) LIKE '%young people%'
);

-- Community Outreach
UPDATE events SET category = 'Community Outreach' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%outreach%' OR 
  LOWER(title) LIKE '%community%' OR 
  LOWER(title) LIKE '%volunteer%' OR
  LOWER(title) LIKE '%charity%' OR
  LOWER(title) LIKE '%fundrais%' OR
  LOWER(title) LIKE '%food bank%' OR
  LOWER(title) LIKE '%homeless%' OR
  LOWER(title) LIKE '%care%' OR
  LOWER(title) LIKE '%support group%' OR
  LOWER(title) LIKE '%wellbeing%' OR
  LOWER(title) LIKE '%mental health%' OR
  LOWER(title) LIKE '%counsell%'
);

-- Camps and Retreats
UPDATE events SET category = 'Camps and Retreats' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%retreat%' OR 
  LOWER(title) LIKE '%camp%' OR 
  LOWER(title) LIKE '%pilgrimage%' OR
  LOWER(title) LIKE '%quiet day%' OR
  LOWER(title) LIKE '%away day%' OR
  LOWER(title) LIKE '%residential%'
);

-- Educational
UPDATE events SET category = 'Educational' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%course%' OR 
  LOWER(title) LIKE '%training%' OR 
  LOWER(title) LIKE '%workshop%' OR
  LOWER(title) LIKE '%lecture%' OR
  LOWER(title) LIKE '%seminar%' OR
  LOWER(title) LIKE '%webinar%' OR
  LOWER(title) LIKE '%learning%' OR
  LOWER(title) LIKE '%masterclass%' OR
  LOWER(title) LIKE '%tutorial%' OR
  LOWER(title) LIKE '%class%'
);

-- Missions
UPDATE events SET category = 'Missions' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%mission%' OR 
  LOWER(title) LIKE '%evangeli%' OR 
  LOWER(title) LIKE '%global%' OR
  LOWER(title) LIKE '%international%' OR
  LOWER(title) LIKE '%cross-cultural%'
);

-- Special Events (prayer nights, banquets, celebrations, etc.)
UPDATE events SET category = 'Special Events' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%prayer%' OR
  LOWER(title) LIKE '%banquet%' OR 
  LOWER(title) LIKE '%celebration%' OR
  LOWER(title) LIKE '%festival%' OR
  LOWER(title) LIKE '%anniversary%' OR
  LOWER(title) LIKE '%night%' OR
  LOWER(title) LIKE '%dinner%' OR
  LOWER(title) LIKE '%launch%' OR
  LOWER(title) LIKE '%gala%' OR
  LOWER(title) LIKE '%awards%' OR
  LOWER(title) LIKE '%exhibition%' OR
  LOWER(title) LIKE '%fair%' OR
  LOWER(title) LIKE '%walk%' OR
  LOWER(title) LIKE '%tour%' OR
  LOWER(title) LIKE '%open day%'
);

-- Fellowship for remaining social/gathering events
UPDATE events SET category = 'Fellowship' 
WHERE category IS NULL AND (
  LOWER(title) LIKE '%fellowship%' OR
  LOWER(title) LIKE '%gathering%' OR
  LOWER(title) LIKE '%meet%' OR
  LOWER(title) LIKE '%social%' OR
  LOWER(title) LIKE '%lunch%' OR
  LOWER(title) LIKE '%breakfast%' OR
  LOWER(title) LIKE '%coffee%' OR
  LOWER(title) LIKE '%game%'
);

-- Catch remaining uncategorized as Special Events
UPDATE events SET category = 'Special Events' 
WHERE category IS NULL;
